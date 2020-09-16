import types from '../types/interactiveTypes';
import status from '../types/commandStatuses';
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

  const attachments = [
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

  if (response === status.ACCEPTED) {
    attachments.push({
      text: 'Choose a winner',
      fallback: 'You are unable to make a choice',
      callback_id: `${types.WINNER_RESPONSE}_${updatedItem.betId}`,
      color: '#3AA3E3',
      attachment_type: 'default',
      actions: [
        {
          name: types.WINNER_RESPONSE,
          text: `<@${updatedItem.creatorUserId}>`,
          type: 'button',
          value: updatedItem.creatorUserId,
          confirm: {
            title: 'Are you sure?',
            text: "You won't be able to change this decision.",
            ok_text: 'Yes',
            dismiss_text: 'No',
          },
        },
        {
          name: types.WINNER_RESPONSE,
          text: `Tie`,
          type: 'button',
          value: 'tie',
          confirm: {
            title: 'Are you sure?',
            text: "You won't be able to change this decision.",
            ok_text: 'Yes',
            dismiss_text: 'No',
          },
        },
        {
          name: types.WINNER_RESPONSE,
          text: `<@${updatedItem.targetUserId}>`,
          type: 'button',
          value: updatedItem.targetUserId,
          confirm: {
            title: 'Are you sure?',
            text: "You won't be able to change this decision.",
            ok_text: 'Yes',
            dismiss_text: 'No',
          },
        },
      ],
    });
  }

  await slackClient.chat.update({
    channel: payload.channel.id,
    ts: updatedItem.Attributes[otherTsField],
    attachments,
  });

  return {
    ...payload.original_message,
    attachments,
  };
}
