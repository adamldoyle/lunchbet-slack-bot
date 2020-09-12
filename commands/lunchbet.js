import * as uuid from 'uuid';
import types from './types';
import status from './status';
import dynamodb from '../libs/dynamodb';

const re = /^<@(?<userId>.*)\|(?<userName>.*)>\s*(?<lunchCount>[0-9]+)\s*(?<description>.*)$/;

export default async function (payload) {
  const matches = payload.text.trim().match(re);
  if (!matches) {
    return {
      response_type: 'ephemeral',
      text: `Invalid syntax: ${types.LUNCHBET} [@user] [# of lunches] [short bet description]`,
    };
  }

  const { userId, lunchCount, description } = matches.groups;
  const params = {
    TableName: process.env.tableName,
    Item: {
      betId: uuid.v1(),
      creatorId: payload.user_id,
      targetUserId: userId,
      lunchCount,
      description,
      status: status.PROPOSED,
      createdAt: Date.now(),
    },
  };
  await dynamodb.put(params);
  return {
    response_type: 'in_channel',
    text: `Lunch bet proposed: <@${userId}> ${lunchCount} lunches that ${description}`,
  };
}
