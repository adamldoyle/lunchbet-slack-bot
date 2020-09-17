import dynamodb from '../libs/dynamodb';
import status from '../types/commandStatuses';
import { sendBetInitial, sendBetProposal } from '../libs/slackMessages';
import handler from './lunchbet';

jest.mock('../libs/dynamodb');
jest.mock('../libs/slackMessages');

describe('lunchbetHandler', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    sendBetInitial.mockResolvedValue({ ts: 13, channel: 'channel13' });
    sendBetProposal.mockResolvedValue({ ts: 14, channel: 'channel14' });
  });

  it('parses and inserts bet into db', async () => {
    await handler({
      user_id: 'myUserId',
      text:
        '27 my win condition vs <@theirUserId|testName> 28 their win condition',
    });
    expect(dynamodb.put).toBeCalledWith(
      expect.objectContaining({
        Item: expect.objectContaining({
          betId: expect.anything(),
          creatorUserId: 'myUserId',
          creatorLunchCount: 27,
          creatorWinCondition: 'my win condition',
          targetUserId: 'theirUserId',
          targetLunchCount: 28,
          targetWinCondition: 'their win condition',
          betStatus: status.PROPOSED,
        }),
      }),
    );
  });

  it('sends slack messages and saves timestamps', async () => {
    const expectedObject = expect.objectContaining({
      betId: expect.anything(),
      creatorUserId: 'myUserId',
      creatorLunchCount: 27,
      creatorWinCondition: 'my win condition',
      targetUserId: 'theirUserId',
      targetLunchCount: 28,
      targetWinCondition: 'their win condition',
      betStatus: status.PROPOSED,
    });
    await handler({
      user_id: 'myUserId',
      text:
        '27 my win condition vs <@theirUserId|testName> 28 their win condition',
    });
    expect(sendBetInitial).toBeCalledWith(expectedObject);
    expect(sendBetProposal).toBeCalledWith(expectedObject);
    expect(dynamodb.update).toBeCalledWith(
      expect.objectContaining({
        Key: {
          betId: dynamodb.put.mock.calls[0][0].Item.betId,
        },
        ExpressionAttributeValues: {
          ':creatorInitialTs': 13,
          ':targetInitialTs': 14,
          ':creatorChannel': 'channel13',
          ':targetChannel': 'channel14',
        },
      }),
    );
  });

  it('returns message to channel', async () => {
    const response = await handler({
      user_id: 'myUserId',
      text:
        '27 my win condition vs <@theirUserId|testName> 28 their win condition',
    });
    expect(response.response_type).toEqual('in_channel');
    expect(response.text).toEqual(
      'Lunch bet proposed: <@myUserId> (27 lunches) my win condition vs <@theirUserId> (28 lunches) their win condition',
    );
  });

  it('returns ephemeral response when invalid syntax', async () => {
    const response = await handler({
      user_id: 'myUserId',
      text:
        '27 my win condition <@theirUserId|testName> 28 their win condition', // no 'vs' between parts
    });
    expect(response.response_type).toEqual('ephemeral');
    expect(response.text).toContain('Invalid syntax');
  });
});
