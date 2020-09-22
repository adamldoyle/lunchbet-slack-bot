import types from '../types/interactiveTypes';
import status from '../types/commandStatuses';
import dynamodb from '../libs/dynamodb';
import slackClient, { getUserMap } from '../libs/slack';
import { sendBetAccepted } from '../libs/slackMessages';
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
      actions: [{ value: 'abc' }],
      callback_id: `${types.WINNER_RESPONSE}_123`,
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
          'betStatus = :requiredStatus AND (targetUserId = :userId OR creatorUserId = :userId) AND (targetUserId = :winner OR creatorUserId = :winner OR "tie" = :winner)',
        UpdateExpression:
          'SET betStatus = :betStatus, winner = :winner, winProposer = :userId',
        ExpressionAttributeValues: {
          ':requiredStatus': status.ACCEPTED,
          ':userId': '456',
          ':betStatus': status.WIN_PROPOSED,
          ':winner': 'abc',
        },
        ReturnValues: 'ALL_NEW',
      }),
    );
  });
});
