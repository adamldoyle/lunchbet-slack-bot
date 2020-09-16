import dynamodb from '../libs/dynamodb';
import types from '../types/commandTypes';
import { buildBetsList } from '../libs/slackMessages';

function usageExample(prefixMessage) {
  const allStatuses = Object.values(types).join('|');
  return `${prefixMessage} Usage: ${types.LUNCHBETS} status=${allStatuses}`;
}

export default async function (payload) {
  const queryMap = payload.text
    .split(' ')
    .filter((part) => part)
    .reduce((acc, part) => {
      const pieces = part.split('=');
      if (pieces.length === 2) {
        if (pieces[0] === 'status') {
          acc[':betStatus'] = pieces[1];
        }
      }
      return acc;
    }, {});

  if (!queryMap[':betStatus']) {
    return {
      response_type: 'ephemeral',
      text: usageExample('Must filter on status.'),
    };
  }

  const params = {
    TableName: process.env.tableName,
    IndexName: 'BetStatusIndex',
    KeyConditionExpression: 'betStatus = :betStatus',
    ExpressionAttributeValues: queryMap,
  };

  const result = await dynamodb.query(params);
  const sections = buildBetsList(result.Items);
  return {
    response_type: 'in_channel',
    blocks: sections,
  };
}
