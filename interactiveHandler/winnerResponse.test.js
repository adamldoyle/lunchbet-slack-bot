import types from '../types/interactiveTypes';
import status from '../types/commandStatuses';
import dynamodb from '../libs/dynamodb';
import slackClient, { getUserMap } from '../libs/slack';
import { buildBetConclusionProposalBlocks } from '../libs/slackMessages';
import handler from './winnerResponse';

jest.mock('../libs/dynamodb');
jest.mock('../libs/slack');
jest.mock('../libs/slackMessages');

describe('winnerResponseHandler', () => {
  let oldEnv;
  beforeEach(() => {
    jest.resetAllMocks();
    oldEnv = process.env;
    process.env = {
      ...oldEnv,
      tableName: 'testTableName',
    };
    getUserMap.mockResolvedValue({});
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  it('updates status and winner in db', async () => {
    const payload = {
      actions: [
        { value: 'abc', action_id: `${types.WINNER_RESPONSE}:123:abc` },
      ],
      user: { id: '456' },
      channel: { id: '789' },
    };
    dynamodb.update.mockResolvedValue({ Attributes: {} });
    await handler(payload);
    expect(dynamodb.update).toBeCalledWith(
      expect.objectContaining({
        TableName: 'testTableName',
        Key: { betId: '123' },
        ConditionExpression:
          'betStatus = :requiredStatus AND (targetUserId = :userId OR creatorUserId = :userId) AND (targetUserId = :winner OR creatorUserId = :winner OR :tie = :winner)',
        UpdateExpression:
          'SET betStatus = :betStatus, winner = :winner, winProposer = :userId',
        ExpressionAttributeValues: {
          ':requiredStatus': status.ACCEPTED,
          ':userId': '456',
          ':betStatus': status.CONCLUSION_PROPOSED,
          ':winner': 'abc',
          ':tie': 'tie',
        },
        ReturnValues: 'ALL_NEW',
      }),
    );
  });

  async function testSlackUpdateToOther(
    conclusion,
    userId,
    expectedPrefix,
    expectedOtherPrefix,
  ) {
    const payload = {
      actions: [
        {
          value: conclusion,
          action_id: `${types.WINNER_RESPONSE}:123:${conclusion}`,
        },
      ],
      user: { id: userId },
    };
    const attributes = {
      targetUserId: '123',
      creatorChannel: '456',
      creatorAcceptTs: '789',
      targetChannel: 'uvw',
      targetAcceptTs: 'xyz',
    };
    dynamodb.update.mockResolvedValue({ Attributes: attributes });
    buildBetConclusionProposalBlocks.mockReturnValue([{ whatever: true }]);
    const userMap = { abc: 'UserABC', def: 'UserDEF' };
    getUserMap.mockResolvedValue(userMap);
    await handler(payload);
    expect(slackClient.chat.update).toBeCalledWith(
      expect.objectContaining({
        channel: attributes[expectedPrefix + 'Channel'],
        ts: attributes[expectedPrefix + 'AcceptTs'],
        blocks: [{ whatever: true }],
      }),
    );
    expect(slackClient.chat.update).toBeCalledWith(
      expect.objectContaining({
        channel: attributes[expectedOtherPrefix + 'Channel'],
        ts: attributes[expectedOtherPrefix + 'AcceptTs'],
        blocks: [{ whatever: true }],
      }),
    );
    return attributes;
  }

  it('sends slack message to update other user', async () => {
    let bet;

    jest.resetAllMocks();
    bet = await testSlackUpdateToOther('abc', '123', 'target', 'creator');
    expect(buildBetConclusionProposalBlocks).toBeCalledWith(
      bet,
      'UserABC won',
      true,
    );
    expect(getUserMap).toBeCalled();

    jest.resetAllMocks();
    bet = await testSlackUpdateToOther('abc', 'other', 'creator', 'target');
    expect(buildBetConclusionProposalBlocks).toBeCalledWith(
      bet,
      'UserABC won',
      true,
    );
    expect(getUserMap).toBeCalled();

    jest.resetAllMocks();
    bet = await testSlackUpdateToOther('tie', '123', 'target', 'creator');
    expect(buildBetConclusionProposalBlocks).toBeCalledWith(bet, 'Tie', true);
    expect(getUserMap).not.toBeCalled();

    jest.resetAllMocks();
    bet = await testSlackUpdateToOther('tie', 'other', 'creator', 'target');
    expect(buildBetConclusionProposalBlocks).toBeCalledWith(bet, 'Tie', true);
    expect(getUserMap).not.toBeCalled();
  });
});
