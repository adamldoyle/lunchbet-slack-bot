import slackClient from './slack';
import interactiveTypes from '../types/interactiveTypes';
import status from '../types/commandStatuses';

const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function betDetails(bet) {
  return (
    `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}\n` +
    `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}\n` +
    `ID - ${bet.betId}`
  );
}

export async function sendBetInitial(bet) {
  const response = await slackClient.chat.postMessage({
    channel: `@${bet.creatorUserId}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `You have proposed a lunch bet to <@${bet.targetUserId}>!`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: betDetails(bet) },
      },
      { type: 'divider' },
      {
        type: 'section',
        block_id: 'actionDescription',
        text: { type: 'mrkdwn', text: 'Choose an action:' },
      },
      {
        type: 'actions',
        block_id: 'actionButtons',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Cancel' },
            action_id: `${interactiveTypes.PROPOSAL_RESPONSE}_${bet.betId}`,
            value: status.CANCELED,
            style: 'danger',
            confirm: {
              title: { type: 'plain_text', text: 'Are you sure?' },
              text: {
                type: 'mrkdwn',
                text: "You won't be able to undo the cancellation.",
              },
              style: 'danger',
              confirm: { type: 'plain_text', text: 'Yes' },
              deny: { type: 'plain_text', text: 'No' },
            },
          },
        ],
      },
    ],
  });

  return { ts: response.ts, channel: response.channel };
}

export async function sendBetProposal(bet) {
  const response = await slackClient.chat.postMessage({
    channel: `@${bet.targetUserId}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<@${bet.creatorUserId}> has proposed a lunch bet to you!`,
        },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: betDetails(bet) },
      },
      { type: 'divider' },
      {
        type: 'section',
        block_id: 'actionDescription',
        text: { type: 'mrkdwn', text: 'Choose an action:' },
      },
      {
        type: 'actions',
        block_id: 'actionButtons',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Accept' },
            action_id: `${interactiveTypes.PROPOSAL_RESPONSE}_${bet.betId}`,
            value: status.ACCEPTED,
            confirm: {
              title: { type: 'plain_text', text: 'Are you sure?' },
              text: {
                type: 'mrkdwn',
                text: "You won't be able to undo this action.",
              },
              style: 'primary',
              confirm: { type: 'plain_text', text: 'Yes' },
              deny: { type: 'plain_text', text: 'No' },
            },
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Decline' },
            action_id: `${interactiveTypes.PROPOSAL_RESPONSE}_${bet.betId}`,
            value: status.DECLINED,
            style: 'danger',
            confirm: {
              title: { type: 'plain_text', text: 'Are you sure?' },
              text: {
                type: 'mrkdwn',
                text: "You won't be able to undo this action.",
              },
              style: 'primary',
              confirm: { type: 'plain_text', text: 'Yes' },
              deny: { type: 'plain_text', text: 'No' },
            },
          },
        ],
      },
    ],
  });

  return { ts: response.ts, channel: response.channel };
}

export async function sendBetAccepted(
  bet,
  creatorUserName,
  targetUserName,
  channel,
) {
  const response = await slackClient.chat.postMessage({
    channel,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `The lunch bet is on!`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: betDetails(bet),
        },
      },
      {
        type: 'divider',
      },
    ],
    attachments: [
      {
        text: 'Choose a winner:',
        fallback: 'You are unable to make a choice',
        callback_id: `${interactiveTypes.WINNER_RESPONSE}_${bet.betId}`,
        color: '#3AA3E3',
        attachment_type: 'default',
        actions: [
          {
            name: interactiveTypes.WINNER_RESPONSE,
            text: creatorUserName,
            type: 'button',
            value: bet.creatorUserId,
            confirm: {
              title: 'Are you sure?',
              text: "You won't be able to change this decision.",
              ok_text: 'Yes',
              dismiss_text: 'No',
            },
          },
          {
            name: interactiveTypes.WINNER_RESPONSE,
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
            name: interactiveTypes.WINNER_RESPONSE,
            text: targetUserName,
            type: 'button',
            value: bet.targetUserId,
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

  return response.ts;
}

export function buildBetsList(bets) {
  return bets
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .reduce(
      (acc, bet) => {
        acc.push({
          type: 'divider',
        });
        acc.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${capitalize(bet.betStatus)}*:\n` + betDetails(bet),
          },
        });
        return acc;
      },
      [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Lunch bets:*',
          },
        },
      ],
    );
}
