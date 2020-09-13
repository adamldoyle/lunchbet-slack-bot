import * as uuid from 'uuid';
import types from './types';
import status from './status';
import dynamodb from '../libs/dynamodb';
import slackClient from '../libs/slack';

const re = /^(?<creatorLunchCount>[0-9]+)\s*(?<creatorWinCondition>.*)\s*vs\s*<@(?<targetUserId>.*)\|(?<targetName>.*)>\s*(?<targetLunchCount>[0-9]+)\s*(?<targetWinCondition>.*)$/;

export default async function (payload) {
  const matches = payload.text.trim().match(re);
  if (!matches) {
    return {
      response_type: 'ephemeral',
      text: `Invalid syntax: ${types.LUNCHBET} [# of lunches you win] [your win condition] vs [@target user] [# of lunches target wins] [target win condition]`,
    };
  }

  let {
    creatorLunchCount,
    creatorWinCondition,
    targetUserId,
    targetLunchCount,
    targetWinCondition,
  } = matches.groups;
  creatorWinCondition = creatorWinCondition.trim();
  targetWinCondition = targetWinCondition.trim();
  const params = {
    TableName: process.env.tableName,
    Item: {
      betId: uuid.v1(),
      creatorId: payload.user_id,
      creatorLunchCount,
      creatorWinCondition,
      targetUserId,
      targetLunchCount,
      targetWinCondition,
      status: status.PROPOSED,
      createdAt: Date.now(),
    },
  };
  await dynamodb.put(params);

  await slackClient.chat.postMessage({
    channel: `@${targetUserId}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<@${params.Item.creatorId}> has proposed a lunch bet to you!`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `<@${params.Item.creatorId}> (*${creatorLunchCount}* lunches) - ${creatorWinCondition}\n` +
            `<@${targetUserId}> (*${targetLunchCount}* lunches) - ${targetWinCondition}\n` +
            `ID - ${params.Item.betId}`,
        },
      },
      {
        type: 'divider',
      },
    ],
    attachments: [
      {
        text: 'Choose an action',
        fallback: 'You are unable to make a choice',
        callback_id: 'bet_proposal_response',
        color: '#3AA3E3',
        attachment_type: 'default',
        actions: [
          {
            name: 'proposal_response',
            text: 'Accept',
            type: 'button',
            value: 'accept',
            confirm: {
              title: 'Are you sure?',
              text: "You won't be able to change this decision.",
              ok_text: 'Yes',
              dismiss_text: 'No',
            },
          },
          {
            name: 'proposal_response',
            text: 'Decline',
            style: 'danger',
            type: 'button',
            value: 'decline',
            confirm: {
              title: 'Are you sure?',
              text: "You won't be able to change this decision.",
              ok_text: 'Yes',
              dismiss_text: 'No',
            },
          },
        ],
      },
    ],
  });

  return {
    response_type: 'in_channel',
    text:
      `Lunch bet proposed: ` +
      `<@${payload.user_id}> (${creatorLunchCount} lunches) ${creatorWinCondition} vs ` +
      `<@${targetUserId}> (${targetLunchCount} lunches) ${targetWinCondition}`,
  };
}
