import status from '../types/commandStatuses';
import dynamodb from '../libs/dynamodb';
import slackClient, { getUserMap } from '../libs/slack';
import { buildBetAcceptedBlocks } from '../libs/slackMessages';

export default async function handler(payload) {
  const response = payload.actions[0].value;
  const betId = payload.actions[0].action_id.split(':')[1];

  const newStatus = response === 'yes' ? status.CONCLUDED : status.ACCEPTED;

  const params = {
    TableName: process.env.tableName,
    Key: {
      betId,
    },
    ConditionExpression:
      'betStatus = :requiredStatus AND (targetUserId = :userId OR creatorUserId = :userId) AND winProposer <> :userId',
    UpdateExpression:
      'SET betStatus = :newStatus' +
      (newStatus === status.CONCLUDED
        ? ''
        : ', winner = NULL, winProposer = NULL'),
    ExpressionAttributeValues: {
      ':requiredStatus': status.CONCLUSION_PROPOSED,
      ':userId': payload.user.id,
      ':newStatus': newStatus,
    },
    ReturnValues: 'ALL_NEW',
  };
  const updatedItem = await dynamodb.update(params);

  if (response !== 'yes') {
    const userMap = await getUserMap();
    const bet = updatedItem.Attributes;

    await slackClient.chat.update({
      channel: bet.creatorChannel,
      ts: bet.creatorAcceptTs,
      blocks: buildBetAcceptedBlocks(
        bet,
        userMap[bet.creatorUserId],
        userMap[bet.targetUserId],
        '0',
      ),
      attachments: [],
    });

    await slackClient.chat.update({
      channel: bet.targetChannel,
      ts: bet.targetAcceptTs,
      blocks: buildBetAcceptedBlocks(
        bet,
        userMap[bet.creatorUserId],
        userMap[bet.targetUserId],
        '1',
      ),
      attachments: [],
    });
  }
}
