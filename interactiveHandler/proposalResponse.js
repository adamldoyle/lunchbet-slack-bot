import types from './types';
import status from '../commands/status';
import dynamodb from '../libs/dynamodb';
import debug from '../libs/debug';

export default async function (payload) {
  const response = payload.actions[0].value;
  const betId = payload.callback_id.split(`${types.PROPOSAL_RESPONSE}_`)[1];
  let userField;
  if (response === status.ACCEPTED || response === status.DECLINED) {
    userField = 'targetUserId';
  } else if (response === status.CANCELED) {
    userField = 'creatorUserId';
  } else {
    throw new Error('Invalid status');
  }
  const params = {
    TableName: process.env.tableName,
    Key: {
      betId,
    },
    ConditionExpression: `${userField} = :userId AND betStatus = :requiredStatus`,
    UpdateExpression: 'SET betStatus = :betStatus',
    ExpressionAttributeValues: {
      ':userId': payload.user.id,
      ':requiredStatus': status.PROPOSED,
      ':betStatus': response,
    },
    ReturnValues: 'ALL_NEW',
  };
  const updatedItem = await dynamodb.update(params);
  debug('updatedItem', updatedItem);
  throw new Error('whatever');

  // return {
  //   ...payload.original_message,
  //   blocks: [
  //     ...payload.original_message.blocks,
  //     {
  //       type: 'section',
  //       text: {
  //         type: 'mrkdwn',
  //         text: `Bet *${response}*`,
  //       },
  //     },
  //   ],
  //   attachments: null,
  // };
}
