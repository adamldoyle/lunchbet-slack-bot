import types from '../types/interactiveTypes';
import status from '../types/commandStatuses';
import dynamodb from '../libs/dynamodb';
import slackClient, { getUserMap } from '../libs/slack';
import {
  sendBetAccepted,
  buildBetInitialBlocks,
  buildBetProposalBlocks,
} from '../libs/slackMessages';

export default async function (payload) {
  const response = payload.actions[0].value;
  let betId;
  if (payload.callback_id) {
    // Deprecated structure
    betId = payload.callback_id.split(`${types.PROPOSAL_RESPONSE}_`)[1];
  } else {
    betId = payload.actions[0].action_id.split(':')[1];
  }

  let userPrefix;
  let otherPrefix;
  let userBuilder;
  let otherBuilder;
  if (response === status.ACCEPTED || response === status.DECLINED) {
    userPrefix = 'target';
    otherPrefix = 'creator';
    userBuilder = buildBetProposalBlocks;
    otherBuilder = buildBetInitialBlocks;
  } else if (response === status.CANCELED) {
    userPrefix = 'creator';
    otherPrefix = 'target';
    userBuilder = buildBetInitialBlocks;
    otherBuilder = buildBetProposalBlocks;
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

  await slackClient.chat.update({
    channel: updatedItem.Attributes[userPrefix + 'Channel'],
    ts: updatedItem.Attributes[userPrefix + 'InitialTs'],
    blocks: userBuilder(updatedItem.Attributes),
    attachments: [],
  });

  await slackClient.chat.update({
    channel: updatedItem.Attributes[otherPrefix + 'Channel'],
    ts: updatedItem.Attributes[otherPrefix + 'InitialTs'],
    blocks: otherBuilder(updatedItem.Attributes),
    attachments: [],
  });

  if (response === status.ACCEPTED) {
    const userMap = await getUserMap();

    const creatorAcceptTs = await sendBetAccepted(
      updatedItem.Attributes,
      userMap[updatedItem.Attributes.creatorUserId],
      userMap[updatedItem.Attributes.targetUserId],
      updatedItem.Attributes.creatorChannel,
      '0',
    );
    const targetAcceptTs = await sendBetAccepted(
      updatedItem.Attributes,
      userMap[updatedItem.Attributes.creatorUserId],
      userMap[updatedItem.Attributes.targetUserId],
      updatedItem.Attributes.targetChannel,
      '1',
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
}
