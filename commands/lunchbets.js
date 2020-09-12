import dynamodb from '../libs/dynamodb';

export default async function (payload) {
  const params = {
    TableName: process.env.tableName,
  };

  const result = await dynamodb.query(params);
  const lunchBetOutput =
    result.Items.length === 0
      ? 'No bets'
      : result.Items.map(
          (bet) =>
            `<@${bet.creatorId}> (${bet.creatorLunchCount} lunches) ${bet.creatorWinCondition} vs ` +
            `<@${bet.targetUserId}> (${bet.targetLunchCount} lunches) ${bet.targetWinCondition}`,
        ).join('\n');
  return {
    response_type: 'in_channel',
    text: `Lunch bets:\n\n${lunchBetOutput}`,
  };
}
