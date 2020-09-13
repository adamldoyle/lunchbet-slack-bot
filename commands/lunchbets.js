import dynamodb from '../libs/dynamodb';

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
            `*Bet (${bet.betId}) proposed at ${bet.createdAt} with status ${bet.status}*\n` +
            `<@${bet.creatorId}> (${bet.creatorLunchCount} lunches) - ${bet.creatorWinCondition} vs\n` +
            `<@${bet.targetUserId}> (${bet.targetLunchCount} lunches) - ${bet.targetWinCondition}`,
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
