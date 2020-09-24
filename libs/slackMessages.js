import slackClient from './slack';
import interactiveTypes from '../types/interactiveTypes';
import status from '../types/commandStatuses';
import debug from './debug';

const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const actionConfirm = {
  title: { type: 'plain_text', text: 'Are you sure?' },
  text: {
    type: 'mrkdwn',
    text: "You won't be able to undo this action.",
  },
  confirm: { type: 'plain_text', text: 'Yes' },
  deny: { type: 'plain_text', text: 'No' },
};

function betDetails(bet) {
  return (
    `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}\n` +
    `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}\n` +
    `ID - ${bet.betId}`
  );
}

function buildBetBlocks(title, bet, actions) {
  return [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: title },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: betDetails(bet) },
    },
    { type: 'divider' },
  ].concat(actions);
}

export function buildBetInitialBlocks(bet) {
  const actions =
    bet.betStatus === status.PROPOSED
      ? [
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
                action_id: `${interactiveTypes.PROPOSAL_RESPONSE}:${bet.betId}:${status.CANCELED}`,
                value: status.CANCELED,
                style: 'danger',
                confirm: actionConfirm,
              },
            ],
          },
        ]
      : [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Bet *${bet.betStatus}*`,
            },
          },
        ];

  return buildBetBlocks(
    `You have proposed a lunch bet to <@${bet.targetUserId}>!`,
    bet,
    actions,
  );
}

export async function sendBetInitial(bet) {
  const response = await slackClient.chat.postMessage({
    channel: `@${bet.creatorUserId}`,
    blocks: buildBetInitialBlocks(bet),
  });

  return { ts: response.ts, channel: response.channel };
}

export function buildBetProposalBlocks(bet) {
  const actions =
    bet.betStatus === status.PROPOSED
      ? [
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
                action_id: `${interactiveTypes.PROPOSAL_RESPONSE}:${bet.betId}:${status.ACCEPTED}`,
                value: status.ACCEPTED,
                confirm: actionConfirm,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Decline' },
                action_id: `${interactiveTypes.PROPOSAL_RESPONSE}:${bet.betId}:${status.DECLINED}`,
                value: status.DECLINED,
                style: 'danger',
                confirm: actionConfirm,
              },
            ],
          },
        ]
      : [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Bet *${bet.betStatus}*`,
            },
          },
        ];

  return buildBetBlocks(
    `<@${bet.creatorUserId}> has proposed a lunch bet to you!`,
    bet,
    actions,
  );
}

export async function sendBetProposal(bet) {
  const response = await slackClient.chat.postMessage({
    channel: `@${bet.targetUserId}`,
    blocks: buildBetProposalBlocks(bet),
  });

  return { ts: response.ts, channel: response.channel };
}

export async function sendBetAccepted(
  bet,
  creatorUserName,
  targetUserName,
  channel,
) {
  const actions = [
    {
      type: 'section',
      block_id: 'actionDescription',
      text: { type: 'mrkdwn', text: 'Choose a winner:' },
    },
    {
      type: 'actions',
      block_id: 'actionButtons',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: creatorUserName },
          action_id: `${interactiveTypes.WINNER_RESPONSE}:${bet.betId}:${bet.creatorUserId}`,
          value: bet.creatorUserId,
          confirm: actionConfirm,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Tie' },
          action_id: `${interactiveTypes.WINNER_RESPONSE}:${bet.betId}:tie`,
          value: 'tie',
          confirm: actionConfirm,
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: targetUserName },
          action_id: `${interactiveTypes.WINNER_RESPONSE}:${bet.betId}:${bet.targetUserId}`,
          value: bet.targetUserId,
          style: 'danger',
          confirm: actionConfirm,
        },
      ],
    },
  ];

  const blocks = buildBetBlocks('The lunch bet is on!', bet, actions);
  debug('Message blocks', blocks);
  const response = await slackClient.chat.postMessage({
    channel,
    blocks,
  });

  return response.ts;
}

export function buildBetConclusionProposalBlocks(
  bet,
  betConclusion,
  includeActions,
) {
  const actions = includeActions
    ? [
        {
          type: 'section',
          block_id: 'actionDescription',
          text: { type: 'mrkdwn', text: 'Is this accurate?' },
        },
        {
          type: 'actions',
          block_id: 'actionButtons',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'Yes' },
              action_id: `${interactiveTypes.CONFIRMATION_RESPONSE}:${bet.betId}:yes`,
              value: 'yes',
              confirm: actionConfirm,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'No' },
              action_id: `${interactiveTypes.CONFIRMATION_RESPONSE}:${bet.betId}:no`,
              value: 'no',
              confirm: actionConfirm,
            },
          ],
        },
      ]
    : [];

  return buildBetBlocks(
    `Bet conclusion proposed: *${betConclusion}*`,
    bet,
    actions,
  );
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
