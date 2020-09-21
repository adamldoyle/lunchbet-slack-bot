import types from '../types/interactiveTypes';
import status from '../types/commandStatuses';
import dynamodb from '../libs/dynamodb';
import slackClient from '../libs/slack';

export default async function (payload) {
  const response = payload.actions[0].value;
  const betId = payload.callback_id.split(`${types.WINNER_RESPONSE}_`)[1];

  const params = {
    TableName: process.env.tableName,
    Key: {
      betId,
    },
    ConditionExpression:
      'betStatus = :requiredStatus AND (targetUserId = :userId OR creatorUserId = :userId) AND (targetUserId = :winner OR creatorUserId = :winner OR "tie" = :winner)',
    UpdateExpression:
      'SET betStatus = :betStatus, winner = :winner, winProposer = :userId',
    ExpressionAttributeValues: {
      ':requiredStatus': status.ACCEPTED,
      ':userId': payload.user.id,
      ':betStatus': status.WIN_PROPOSED,
      ':winner': response,
    },
    ReturnValues: 'ALL_NEW',
  };
  const updatedItem = await dynamodb.update(params);

  let userPrefix;
  // let otherPrefix;
  if (payload.user.id === updatedItem.Attributes.targetUserId) {
    userPrefix = 'target';
    // otherPrefix = 'creator';
  } else {
    userPrefix = 'creator';
    // otherPrefix = 'target';
  }

  const updatedUserAttachments = [
    {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Bet conclusion: *${response}*`,
          },
        },
      ],
    },
  ];
  await slackClient.chat.update({
    channel: updatedItem.Attributes[userPrefix + 'Channel'],
    ts: updatedItem.Attributes[userPrefix + 'AcceptTs'],
    attachments: updatedUserAttachments,
  });


}
