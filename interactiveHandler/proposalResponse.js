import types from './types';
import status from '../commands/status';
import dynamodb from '../libs/dynamodb';

export default async function (payload) {
  const response = payload.actions[0].value;
  const betId = payload.callback_id.split(`${types.PROPOSAL_RESPONSE}_`)[1];
  const newStatus = response === 'accept' ? status.ACCEPTED : status.DECLINED;
  const params = {
    TableName: process.env.tableName,
    Key: {
      betId,
    },
    ConditionExpression:
      'targetUserId = :targetUserId AND betStatus = :requiredStatus',
    UpdateExpression: 'SET betStatus = :betStatus',
    ExpressionAttributeValues: {
      ':targetUserId': payload.user.id,
      ':requiredStatus': status.PROPOSED,
      ':betStatus': newStatus,
    },
  };
  await dynamodb.update(params);

  return {
    ...payload.original_message,
    blocks: [
      ...payload.original_message.blocks,
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `You *${newStatus}*`,
        },
      },
    ],
    attachments: null,
  };
}
