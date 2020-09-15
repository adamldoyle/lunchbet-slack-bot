import * as uuid from 'uuid';
import types from './types';
import status from './status';
import dynamodb from '../libs/dynamodb';
import { sendBetInitial, sendBetProposal } from '../libs/slackMessages';

const re = /^(?<creatorLunchCount>[0-9]+)\s*(?<creatorWinCondition>.*)\s*vs\s*<@(?<targetUserId>.*)\|(?<targetName>.*)>\s*(?<targetLunchCount>[0-9]+)\s*(?<targetWinCondition>.*)$/;

export default async function (payload) {
  const matches = payload.text.trim().match(re);
  if (!matches) {
    return {
      response_type: 'ephemeral',
      text: `Invalid syntax: ${types.LUNCHBET} [# of lunches you win] [your win condition] vs [@target user] [# of lunches target wins] [target win condition]`,
    };
  }

  let {
    creatorLunchCount,
    creatorWinCondition,
    targetUserId,
    targetLunchCount,
    targetWinCondition,
  } = matches.groups;
  creatorWinCondition = creatorWinCondition.trim();
  targetWinCondition = targetWinCondition.trim();

  const params = {
    TableName: process.env.tableName,
    Item: {
      betId: uuid.v1(),
      creatorUserId: payload.user_id,
      creatorLunchCount,
      creatorWinCondition,
      targetUserId,
      targetLunchCount,
      targetWinCondition,
      betStatus: status.PROPOSED,
      createdAt: Date.now(),
    },
  };
  await dynamodb.put(params);

  const initialTs = await sendBetInitial(params.Item);
  const proposalTs = await sendBetProposal(params.Item);

  const updateParams = {
    TableName: process.env.tableName,
    Key: {
      betId: params.Item.betId,
    },
    UpdateExpression: 'SET initialTs = :initialTs, proposalTs = :proposalTs',
    ExpressionAttributeValues: {
      ':initialTs': initialTs,
      ':proposalTs': proposalTs,
    },
  };
  await dynamodb.update(updateParams);

  return {
    response_type: 'in_channel',
    text:
      `Lunch bet proposed: ` +
      `<@${payload.user_id}> (${creatorLunchCount} lunches) ${creatorWinCondition} vs ` +
      `<@${targetUserId}> (${targetLunchCount} lunches) ${targetWinCondition}`,
  };
}
