import types from '../types/interactiveTypes';
import status from '../types/commandStatuses';
import dynamodb from '../libs/dynamodb';
import slackClient, { getUserMap } from '../libs/slack';
import { buildBetConclusionProposalBlocks } from '../libs/slackMessages';

export default async function (payload) {
  const response = payload.actions[0].value;
  let betId;
  if (payload.callback_id) {
    // Deprecated structure
    betId = payload.callback_id.split(`${types.WINNER_RESPONSE}_`)[1];
  } else {
    betId = payload.actions[0].action_id.split(':')[1];
  }

  const params = {
    TableName: process.env.tableName,
    Key: {
      betId,
    },
    ConditionExpression:
      'betStatus = :requiredStatus AND (targetUserId = :userId OR creatorUserId = :userId) AND (targetUserId = :winner OR creatorUserId = :winner OR :tie = :winner)',
    UpdateExpression:
      'SET betStatus = :betStatus, winner = :winner, winProposer = :userId',
    ExpressionAttributeValues: {
      ':requiredStatus': status.ACCEPTED,
      ':userId': payload.user.id,
      ':betStatus': status.CONCLUSION_PROPOSED,
      ':winner': response,
      ':tie': 'tie',
    },
    ReturnValues: 'ALL_NEW',
  };
  const updatedItem = await dynamodb.update(params);

  let userPrefix;
  let otherPrefix;
  if (payload.user.id === updatedItem.Attributes.targetUserId) {
    userPrefix = 'target';
    otherPrefix = 'creator';
  } else {
    userPrefix = 'creator';
    otherPrefix = 'target';
  }

  let betConclusion;
  if (response === 'tie') {
    betConclusion = 'Tie';
  } else {
    const userMap = await getUserMap();
    betConclusion = `${userMap[response]} won`;
  }

  await slackClient.chat.update({
    channel: updatedItem.Attributes[userPrefix + 'Channel'],
    ts: updatedItem.Attributes[userPrefix + 'AcceptTs'],
    blocks: buildBetConclusionProposalBlocks(
      updatedItem.Attributes,
      betConclusion,
      false,
    ),
    attachments: [],
  });

  await slackClient.chat.update({
    channel: updatedItem.Attributes[otherPrefix + 'Channel'],
    ts: updatedItem.Attributes[otherPrefix + 'AcceptTs'],
    blocks: buildBetConclusionProposalBlocks(
      updatedItem.Attributes,
      betConclusion,
      true,
    ),
    attachments: [],
  });
}
