import slackClient from './slack';
import interactiveTypes from '../types/interactiveTypes';
import status from '../types/commandStatuses';
import * as slackMessages from './slackMessages';

jest.mock('./slack');
jest.mock('./debug');

describe('slackMessages', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    slackClient.chat.postMessage.mockResolvedValue({
      ts: 'testTs',
      channel: 'testChannel',
    });
  });

  describe('buildBetInitialBlocks', () => {
    it('bbib includes bet details', () => {
      const bet = {
        creatorUserId: 'testCreator',
        targetUserId: 'testTarget',
        creatorLunchCount: 1,
        targetLunchCount: 2,
        creatorWinCondition: 'creatorCondition',
        targetWinCondition: 'targetCondition',
        betId: '123',
        betStatus: status.PROPOSED,
      };
      const blocks = JSON.stringify(slackMessages.buildBetInitialBlocks(bet));
      expect(blocks).toContain(
        `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}`,
      );
      expect(blocks).toContain(
        `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}`,
      );
      expect(blocks).toContain(bet.betId);
    });

    it('bbib includes cancel button', () => {
      const bet = { betId: '123', betStatus: status.PROPOSED };
      const blocks = slackMessages.buildBetInitialBlocks(bet);
      expect(blocks[blocks.length - 1].elements[0].action_id).toEqual(
        `${interactiveTypes.PROPOSAL_RESPONSE}:123:${status.CANCELED}`,
      );
      expect(blocks[blocks.length - 1].elements[0].value).toEqual(
        status.CANCELED,
      );
    });

    function validateNonProposed(betStatus) {
      const bet = { betId: '123', betStatus };
      const blocks = slackMessages.buildBetInitialBlocks(bet);
      expect(blocks[blocks.length - 1].elements).toBeUndefined();
      expect(JSON.stringify(blocks)).toContain(`Bet *${bet.betStatus}*`);
    }

    it('bbib excludes buttons when not PROPOSED and shows status', () => {
      validateNonProposed(status.ACCEPTED);
      validateNonProposed(status.DECLINED);
      validateNonProposed(status.CANCELED);
    });
  });

  describe('sendBetInitial', () => {
    it('sbi returns timestamp from slack message', async () => {
      const bet = {};
      const response = await slackMessages.sendBetInitial(bet);
      expect(response).toEqual({ ts: 'testTs', channel: 'testChannel' });
    });

    it('sbi sends to creator', async () => {
      const bet = {
        creatorUserId: 'testUserId',
      };
      await slackMessages.sendBetInitial(bet);
      const payload = slackClient.chat.postMessage.mock.calls[0][0];
      expect(payload.channel).toEqual('@testUserId');
    });

    it('sbi includes blocks', async () => {
      const bet = {
        creatorUserId: 'testCreator',
        targetUserId: 'testTarget',
        creatorLunchCount: 1,
        targetLunchCount: 2,
        creatorWinCondition: 'creatorCondition',
        targetWinCondition: 'targetCondition',
        betId: '123',
        betStatus: status.PROPOSED,
      };
      await slackMessages.sendBetInitial(bet);
      const blocks = JSON.stringify(
        slackClient.chat.postMessage.mock.calls[0][0].blocks,
      );
      expect(blocks).toContain(
        `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}`,
      );
      expect(blocks).toContain(
        `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}`,
      );
      expect(blocks).toContain(bet.betId);
    });
  });

  describe('buildBetProposalBlocks', () => {
    it('bbpb includes bet details', () => {
      const bet = {
        creatorUserId: 'testCreator',
        targetUserId: 'testTarget',
        creatorLunchCount: 1,
        targetLunchCount: 2,
        creatorWinCondition: 'creatorCondition',
        targetWinCondition: 'targetCondition',
        betId: '123',
        betStatus: status.PROPOSED,
      };
      const blocks = JSON.stringify(slackMessages.buildBetProposalBlocks(bet));
      expect(blocks).toContain(
        `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}`,
      );
      expect(blocks).toContain(
        `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}`,
      );
      expect(blocks).toContain(bet.betId);
    });

    it('bbpb includes accept and decline buttons', () => {
      const bet = { betId: '123', betStatus: status.PROPOSED };
      const blocks = slackMessages.buildBetProposalBlocks(bet);

      expect(blocks[blocks.length - 1].elements[0].action_id).toEqual(
        `${interactiveTypes.PROPOSAL_RESPONSE}:123:${status.ACCEPTED}`,
      );
      expect(blocks[blocks.length - 1].elements[0].value).toEqual(
        status.ACCEPTED,
      );

      expect(blocks[blocks.length - 1].elements[1].action_id).toEqual(
        `${interactiveTypes.PROPOSAL_RESPONSE}:123:${status.DECLINED}`,
      );
      expect(blocks[blocks.length - 1].elements[1].value).toEqual(
        status.DECLINED,
      );
    });

    function validateNonProposed(betStatus) {
      const bet = { betId: '123', betStatus };
      const blocks = slackMessages.buildBetProposalBlocks(bet);
      expect(blocks[blocks.length - 1].elements).toBeUndefined();
      expect(JSON.stringify(blocks)).toContain(`Bet *${bet.betStatus}*`);
    }

    it('bbpb excludes buttons when not PROPOSED and shows status', () => {
      validateNonProposed(status.ACCEPTED);
      validateNonProposed(status.DECLINED);
      validateNonProposed(status.CANCELED);
    });
  });

  describe('sendBetProposal', () => {
    it('sbp returns timestamp from slack message', async () => {
      const bet = {};
      const response = await slackMessages.sendBetProposal(bet);
      expect(response).toEqual({ ts: 'testTs', channel: 'testChannel' });
    });

    it('sbp sends to target', async () => {
      const bet = {
        targetUserId: 'testUserId',
      };
      await slackMessages.sendBetProposal(bet);
      const payload = slackClient.chat.postMessage.mock.calls[0][0];
      expect(payload.channel).toEqual('@testUserId');
    });

    it('sbp includes blocks', async () => {
      const bet = {
        creatorUserId: 'testCreator',
        targetUserId: 'testTarget',
        creatorLunchCount: 1,
        targetLunchCount: 2,
        creatorWinCondition: 'creatorCondition',
        targetWinCondition: 'targetCondition',
        betId: '123',
        betStatus: status.PROPOSED,
      };
      await slackMessages.sendBetProposal(bet);
      const blocks = JSON.stringify(
        slackClient.chat.postMessage.mock.calls[0][0].blocks,
      );
      expect(blocks).toContain(
        `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}`,
      );
      expect(blocks).toContain(
        `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}`,
      );
      expect(blocks).toContain(bet.betId);
    });
  });

  describe('sendBetAccepted', () => {
    it('sba returns timestamp from slack message', async () => {
      const bet = {};
      const response = await slackMessages.sendBetAccepted(
        bet,
        'user1',
        'user2',
        'testChannel',
        '1',
      );
      expect(response).toEqual('testTs');
    });

    it('sba sends to creator', async () => {
      const bet = {
        targetUserId: 'testUserId',
      };
      await slackMessages.sendBetAccepted(
        bet,
        'user1',
        'user2',
        'testChannel',
        '1',
      );
      const payload = slackClient.chat.postMessage.mock.calls[0][0];
      expect(payload.channel).toEqual('testChannel');
    });

    it('sba includes bet details', async () => {
      const bet = {
        creatorUserId: 'testCreator',
        targetUserId: 'testTarget',
        creatorLunchCount: 1,
        targetLunchCount: 2,
        creatorWinCondition: 'creatorCondition',
        targetWinCondition: 'targetCondition',
        betId: '123',
      };
      await slackMessages.sendBetAccepted(
        bet,
        'user1',
        'user2',
        'testChannel',
        '1',
      );
      const payload = slackClient.chat.postMessage.mock.calls[0][0];
      const blocks = JSON.stringify(payload.blocks);
      expect(blocks).toContain(
        `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}`,
      );
      expect(blocks).toContain(
        `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}`,
      );
      expect(blocks).toContain(bet.betId);
    });

    it('sba includes winner and tie buttons', async () => {
      const bet = {
        betId: '123',
        creatorUserId: 'testCreator',
        targetUserId: 'testTarget',
      };
      await slackMessages.sendBetAccepted(
        bet,
        'user1',
        'user2',
        'testChannel',
        '1',
      );
      const payload = slackClient.chat.postMessage.mock.calls[0][0];

      const blocks = payload.blocks;
      const block = blocks[blocks.length - 1];
      expect(block.elements[0].action_id).toEqual(
        `${interactiveTypes.WINNER_RESPONSE}:123:${bet.creatorUserId}:1`,
      );
      expect(block.elements[0].value).toEqual(bet.creatorUserId);
      expect(block.elements[0].text.text).toEqual('user1');

      expect(block.elements[1].action_id).toEqual(
        `${interactiveTypes.WINNER_RESPONSE}:123:tie:1`,
      );
      expect(block.elements[1].value).toEqual('tie');
      expect(block.elements[1].text.text).toEqual('Tie');

      expect(block.elements[2].action_id).toEqual(
        `${interactiveTypes.WINNER_RESPONSE}:123:${bet.targetUserId}:1`,
      );
      expect(block.elements[2].value).toEqual(bet.targetUserId);
      expect(block.elements[2].text.text).toEqual('user2');
    });
  });

  describe('buildBetConclusionProposalBlocks', () => {
    function validateBetDetails(includeActions) {
      const bet = {
        creatorUserId: 'testCreator',
        targetUserId: 'testTarget',
        creatorLunchCount: 1,
        targetLunchCount: 2,
        creatorWinCondition: 'creatorCondition',
        targetWinCondition: 'targetCondition',
        betId: '123',
      };
      const blocks = JSON.stringify(
        slackMessages.buildBetConclusionProposalBlocks(
          bet,
          'testConclusion',
          includeActions,
        ),
      );
      expect(blocks).toContain(
        `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}`,
      );
      expect(blocks).toContain(
        `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}`,
      );
      expect(blocks).toContain(bet.betId);
      expect(blocks).toContain('Bet conclusion proposed: *testConclusion*');
    }

    it('bbcpb includes bet details', () => {
      jest.resetAllMocks();
      validateBetDetails(true);

      jest.resetAllMocks();
      validateBetDetails(false);
    });

    it('bbcpb includes buttons if requested', () => {
      const bet = { betId: '123' };
      const blocks = slackMessages.buildBetConclusionProposalBlocks(
        bet,
        'testConclusion',
        true,
      );

      expect(blocks[blocks.length - 1].elements[0].action_id).toEqual(
        `${interactiveTypes.CONFIRMATION_RESPONSE}:123:yes`,
      );
      expect(blocks[blocks.length - 1].elements[0].value).toEqual('yes');

      expect(blocks[blocks.length - 1].elements[1].action_id).toEqual(
        `${interactiveTypes.CONFIRMATION_RESPONSE}:123:no`,
      );
      expect(blocks[blocks.length - 1].elements[1].value).toEqual('no');
    });

    it('bbcpb excludes buttons if requested', () => {
      const bet = { betId: '123' };
      const blocks = slackMessages.buildBetConclusionProposalBlocks(
        bet,
        'testConclusion',
        false,
      );

      expect(blocks[blocks.length - 1].elements).toBeUndefined();
    });
  });

  describe('buildBetsList', () => {
    it('bbl sorts by createdAt (newest first)', () => {
      const bets = [
        { createdAt: 2, betId: 'ID2' },
        { createdAt: 3, betId: 'ID3' },
        { createdAt: 1, betId: 'ID1' },
      ];
      const response = JSON.stringify(slackMessages.buildBetsList(bets));
      const indexOf1 = response.indexOf('ID1');
      const indexOf2 = response.indexOf('ID2');
      const indexOf3 = response.indexOf('ID3');
      expect(indexOf1).toBeGreaterThan(indexOf2);
      expect(indexOf2).toBeGreaterThan(indexOf3);
    });

    it('bbl includes bet details', () => {
      const bets = [
        {
          betStatus: status.ACCEPTED,
          creatorUserId: 'testCreator1',
          targetUserId: 'testTarget1',
          creatorLunchCount: 11,
          targetLunchCount: 21,
          creatorWinCondition: 'creatorCondition1',
          targetWinCondition: 'targetCondition1',
          betId: '1231',
          createdAt: 2,
        },
        {
          betStatus: status.DECLINED,
          creatorUserId: 'testCreator2',
          targetUserId: 'testTarget2',
          creatorLunchCount: 12,
          targetLunchCount: 22,
          creatorWinCondition: 'creatorCondition2',
          targetWinCondition: 'targetCondition2',
          betId: '1232',
          createdAt: 1,
        },
      ];
      const blocks = slackMessages.buildBetsList(bets);
      for (let i = 0; i < bets.length; i++) {
        const bet = bets[i];
        const section = blocks[i * 2 + 2].text.text;
        expect(section).toContain(
          bet.betStatus === status.ACCEPTED ? 'Accepted' : 'Declined',
        );
        expect(section).toContain(
          `<@${bet.creatorUserId}> (*${bet.creatorLunchCount}* lunches) - ${bet.creatorWinCondition}`,
        );
        expect(section).toContain(
          `<@${bet.targetUserId}> (*${bet.targetLunchCount}* lunches) - ${bet.targetWinCondition}`,
        );
        expect(section).toContain(bet.betId);
      }
    });
  });
});
