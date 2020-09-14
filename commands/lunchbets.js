import dynamodb from '../libs/dynamodb';

const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default async function (payload) {
  const params = {
    TableName: process.env.tableName,
  };

  const result = await dynamodb.scan(params);
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
            `<@${bet.creatorId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}\n` +
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
