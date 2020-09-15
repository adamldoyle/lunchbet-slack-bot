import types from './types';
import status from '../commands/status';
import dynamodb from '../libs/dynamodb';
import slackClient from '../libs/slack';

export default async function (payload) {
  const response = payload.actions[0].value;
  const betId = payload.callback_id.split(`${types.PROPOSAL_RESPONSE}_`)[1];

  let userField;
  let otherTsField;
  if (response === status.ACCEPTED || response === status.DECLINED) {
    userField = 'targetUserId';
    otherTsField = 'initialTs';
  } else if (response === status.CANCELED) {
    userField = 'creatorUserId';
    otherTsField = 'proposalTs';
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

  await slackClient.chat.update({
    channel: payload.channel.id,
    ts: updatedItem.Attributes[otherTsField],
    attachments: [
      {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Bet *${response}*`,
            },
          },
        ],
      },
    ],
  });

  return {
    ...payload.original_message,
    attachments: [
      {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Bet *${response}*`,
            },
          },
        ],
      },
    ],
  };
}
