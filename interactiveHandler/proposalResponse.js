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
    UpdateExpression: 'SET betStatus = :betStatus',
    ExpressionAttributeValues: {
      ':betStatus': newStatus,
    },
  };
  const response = await dynamodb.update(params);
  console.log(response);

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
