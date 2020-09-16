import slackClient from './slack';
import interactiveTypes from '../types/interactiveTypes';
import status from '../types/commandStatuses';

const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

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
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}\n` +
            `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}\n` +
            `ID - ${bet.betId}`,
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
        callback_id: `${interactiveTypes.PROPOSAL_RESPONSE}_${bet.betId}`,
        color: '#3AA3E3',
        attachment_type: 'default',
        actions: [
          {
            name: interactiveTypes.PROPOSAL_RESPONSE,
            text: 'Cancel',
            style: 'danger',
            type: 'button',
            value: status.CANCELED,
            confirm: {
              title: 'Are you sure?',
              text: "You won't be able to undo the cancellation.",
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
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}\n` +
            `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}\n` +
            `ID - ${bet.betId}`,
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
        callback_id: `${interactiveTypes.PROPOSAL_RESPONSE}_${bet.betId}`,
        color: '#3AA3E3',
        attachment_type: 'default',
        actions: [
          {
            name: interactiveTypes.PROPOSAL_RESPONSE,
            text: 'Accept',
            type: 'button',
            value: status.ACCEPTED,
            confirm: {
              title: 'Are you sure?',
              text: "You won't be able to change this decision.",
              ok_text: 'Yes',
              dismiss_text: 'No',
            },
          },
          {
            name: interactiveTypes.PROPOSAL_RESPONSE,
            text: 'Decline',
            style: 'danger',
            type: 'button',
            value: status.DECLINED,
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
            text:
              `*${capitalize(bet.betStatus)}*:\n` +
              `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}\n` +
              `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}\n` +
              `ID - ${bet.betId}`,
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
