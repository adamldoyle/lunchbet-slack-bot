import * as uuid from 'uuid';
import types from './types';
import status from './status';
import dynamodb from '../libs/dynamodb';

const re = /^(?<creatorLunchCount>[0-9]+)\s*(?<creatorWinCondition>.*)\s*vs\s*<@(?<targetUserId>.*)\|(?<targetName>.*)>\s*(?<targetLunchCount>[0-9]+)\s*(?<targetWinCondition>.*)$/;

export default async function (payload) {
  const matches = payload.text.trim().match(re);
  if (!matches) {
    return {
      response_type: 'ephemeral',
      text: `Invalid syntax: ${types.LUNCHBET} [# of lunches you win] [your win condition] vs [@target user] [# of lunches target wins] [target win condition]`,
    };
  }

  const {
    creatorLunchCount,
    creatorWinCondition,
    targetUserId,
    targetLunchCount,
    targetWinCondition,
  } = matches.groups;
  const params = {
    TableName: process.env.tableName,
    Item: {
      betId: uuid.v1(),
      creatorId: payload.user_id,
      creatorLunchCount,
      creatorWinCondition: creatorWinCondition.trim(),
      targetUserId,
      targetLunchCount,
      targetWinCondition: targetWinCondition.trim(),
      status: status.PROPOSED,
      createdAt: Date.now(),
    },
  };
  await dynamodb.put(params);
  return {
    response_type: 'in_channel',
    text:
      `Lunch bet proposed: ` +
      `<@${payload.user_id}> (${creatorLunchCount} lunches) ${creatorWinCondition} vs ` +
      `<@${targetUserId}> (${targetLunchCount} lunches) ${targetWinCondition}`,
  };
}
