import dynamodb from '../libs/dynamodb';
import types from './types';
import debug from '../libs/debug';

const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const userRegex = /<@(?<userId>.*)\|(?<userName>.*)>/;

function usageExample(prefixMessage) {
  const allStatuses = Object.values(types).join('|');
  return `${prefixMessage} Usage: ${types.LUNCHBETS} status=${allStatuses} [user=@user]`;
}

export default async function (payload) {
  // /lunchbets status=pending user=<@userId|userName>
  const queryMap = payload.text
    .split(' ')
    .filter((part) => part)
    .reduce((acc, part) => {
      const pieces = part.split('=');
      if (pieces.length === 2) {
        if (pieces[0] === 'status') {
          acc[':betStatus'] = pieces[1];
        } else if (pieces[0] === 'user') {
          const matches = pieces[1].match(userRegex);
          if (!matches) {
            return {
              response_type: 'ephemeral',
              text: usageExample('Invalid user format.'),
            };
          }
          acc[':userId'] = matches.groups.userId;
        }
      }
      return acc;
    }, {});

  if (Object.keys(queryMap) === 0) {
    return {
      response_type: 'ephemeral',
      text: usageExample('Must filter on something.'),
    };
  }

  debug('queryMap', queryMap);
  const params = {
    TableName: process.env.tableName,
    IndexName: 'BetStatusIndex',
    KeyConditionExpression: 'betStatus = :betStatus',
    FilterExpression: queryMap[':userId']
      ? 'creatorUserId = :userId OR targetUserID = :userId'
      : '',
    ExpressionAttributeValues: queryMap,
  };

  const result = await dynamodb.query(params);
  const sections = result.Items.sort((a, b) =>
    a.createdAt < b.createdAt ? -1 : 1,
  ).reduce(
    (acc, bet) => {
      acc.push({
        type: 'divider',
      });
      acc.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*${capitalize(bet.betStatus)}*:\n` +
            `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}\n` +
            `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}\n` +
            `ID - ${bet.betId}`,
        },
      });
      return acc;
    },
    [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Lunch bets:*',
        },
      },
    ],
  );
  return {
    response_type: 'in_channel',
    blocks: sections,
  };
}
