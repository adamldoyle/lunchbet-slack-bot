import types from './types';
import status from '../commands/status';
import dynamodb from '../libs/dynamodb';

export default async function (payload) {
  const response = payload.actions[0].value;
  const betId = payload.callback_id.split(`${types.PROPOSAL_RESPONSE}_`)[1];
  const params = {
    TableName: process.env.tableName,
    Key: {
      betId,
    },
    UpdateExpression: 'SET status = :status',
    ExpressionAttributeValues: {
      ':status': response === 'accept' ? status.ACCEPTED : status.DECLINED,
    },
  };
  await dynamodb.update(params);
}
