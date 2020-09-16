import types from '../types/interactiveTypes';
import status from '../types/commandStatuses';
import dynamodb from '../libs/dynamodb';
import slackClient, { getUserMap } from '../libs/slack';
import { sendBetAccepted } from '../libs/slackMessages';

export default async function (payload) {
  const response = payload.actions[0].value;
  const betId = payload.callback_id.split(`${types.PROPOSAL_RESPONSE}_`)[1];

  let userPrefix;
  let otherPrefix;
  if (response === status.ACCEPTED || response === status.DECLINED) {
    userPrefix = 'target';
    otherPrefix = 'creator';
  } else if (response === status.CANCELED) {
    userPrefix = 'creator';
    otherPrefix = 'target';
  } else {
    throw new Error('Invalid status');
  }

  const params = {
    TableName: process.env.tableName,
    Key: {
      betId,
    },
    ConditionExpression: `${userPrefix}UserId = :userId AND betStatus = :requiredStatus`,
    UpdateExpression: 'SET betStatus = :betStatus',
    ExpressionAttributeValues: {
      ':userId': payload.user.id,
      ':requiredStatus': status.PROPOSED,
      ':betStatus': response,
    },
    ReturnValues: 'ALL_NEW',
  };
  const updatedItem = await dynamodb.update(params);

  const updatedAttachments = [
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
  ];

  await slackClient.chat.update({
    channel: updatedItem.Attributes[otherPrefix + 'Channel'],
    ts: updatedItem.Attributes[otherPrefix + 'InitialTs'],
    attachments: updatedAttachments,
  });

  if (response === status.ACCEPTED) {
    const userMap = await getUserMap();

    // TODO: Need to save these ids
    const creatorAcceptTs = await sendBetAccepted(
      updatedItem.Attributes,
      userMap[updatedItem.Attributes.creatorUserId],
      userMap[updatedItem.Attributes.targetUserId],
      updatedItem.Attributes.creatorChannel,
    );
    const targetAcceptTs = await sendBetAccepted(
      updatedItem.Attributes,
      userMap[updatedItem.Attributes.creatorUserId],
      userMap[updatedItem.Attributes.targetUserId],
      updatedItem.Attributes.targetChannel,
    );

    const updateParams = {
      TableName: process.env.tableName,
      Key: {
        betId,
      },
      UpdateExpression:
        'SET creatorAcceptTs = :creatorAcceptTs, targetAcceptTs = :targetAcceptTs',
      ExpressionAttributeValues: {
        ':creatorAcceptTs': creatorAcceptTs,
        ':targetAcceptTs': targetAcceptTs,
      },
    };
    await dynamodb.update(updateParams);
  }

  return {
    ...payload.original_message,
    attachments: updatedAttachments,
  };
}
