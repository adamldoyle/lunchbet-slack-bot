import slackClient from './slack';
import interactiveTypes from '../types/interactiveTypes';
import status from '../types/commandStatuses';
import {
  sendBetInitial,
  sendBetProposal,
  buildBetsList,
} from './slackMessages';

jest.mock('./slack');

describe('slackMessages', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    slackClient.chat.postMessage.mockResolvedValue({
      ts: 'testTs',
    });
  });

  describe('sendBetInitial', () => {
    it('returns timestamp from slack message', async () => {
      const bet = {};
      const response = await sendBetInitial(bet);
      expect(response).toEqual('testTs');
    });

    it('sends to creator', async () => {
      const bet = {
        creatorUserId: 'testUserId',
      };
      await sendBetInitial(bet);
      const payload = slackClient.chat.postMessage.mock.calls[0][0];
      expect(payload.channel).toEqual('@testUserId');
    });

    it('includes bet details', async () => {
      const bet = {
        creatorUserId: 'testCreator',
        targetUserId: 'testTarget',
        creatorLunchCount: 1,
        targetLunchCount: 2,
        creatorWinCondition: 'creatorCondition',
        targetWinCondition: 'targetCondition',
        betId: '123',
      };
      await sendBetInitial(bet);
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

    it('includes cancel button', async () => {
      const bet = { betId: '123' };
      await sendBetInitial(bet);
      const payload = slackClient.chat.postMessage.mock.calls[0][0];
      expect(payload.attachments[0].callback_id).toEqual(
        `${interactiveTypes.PROPOSAL_RESPONSE}_123`,
      );
      expect(payload.attachments[0].actions[0].value).toEqual(status.CANCELED);
    });
  });

  describe('sendBetProposal', () => {
    it('returns timestamp from slack message', async () => {
      const bet = {};
      const response = await sendBetProposal(bet);
      expect(response).toEqual('testTs');
    });

    it('sends to target', async () => {
      const bet = {
        targetUserId: 'testUserId',
      };
      await sendBetProposal(bet);
      const payload = slackClient.chat.postMessage.mock.calls[0][0];
      expect(payload.channel).toEqual('@testUserId');
    });

    it('includes bet details', async () => {
      const bet = {
        creatorUserId: 'testCreator',
        targetUserId: 'testTarget',
        creatorLunchCount: 1,
        targetLunchCount: 2,
        creatorWinCondition: 'creatorCondition',
        targetWinCondition: 'targetCondition',
        betId: '123',
      };
      await sendBetProposal(bet);
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

    it('includes accept and decline buttons', async () => {
      const bet = { betId: '123' };
      await sendBetProposal(bet);
      const payload = slackClient.chat.postMessage.mock.calls[0][0];
      expect(payload.attachments[0].callback_id).toEqual(
        `${interactiveTypes.PROPOSAL_RESPONSE}_123`,
      );
      expect(payload.attachments[0].actions[0].value).toEqual(status.ACCEPTED);
      expect(payload.attachments[0].actions[1].value).toEqual(status.DECLINED);
    });
  });

  describe('buildBetsList', () => {
    it('sorts by createdAt (newest first)', () => {
      const bets = [
        { createdAt: 2, betId: 'ID2' },
        { createdAt: 3, betId: 'ID3' },
        { createdAt: 1, betId: 'ID1' },
      ];
      const response = JSON.stringify(buildBetsList(bets));
      const indexOf1 = response.indexOf('ID1');
      const indexOf2 = response.indexOf('ID2');
      const indexOf3 = response.indexOf('ID3');
      expect(indexOf1).toBeGreaterThan(indexOf2);
      expect(indexOf2).toBeGreaterThan(indexOf3);
    });

    it('includes bet details', () => {
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
      const blocks = buildBetsList(bets);
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
