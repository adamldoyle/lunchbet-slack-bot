import dynamodb from '../libs/dynamodb';
import { buildBetsList } from '../libs/slackMessages';
import handler from './lunchbets';

jest.mock('../libs/dynamodb');
jest.mock('../libs/slackMessages');

describe('lunchbetsHandler', () => {
  let oldEnv;

  beforeEach(() => {
    oldEnv = process.env;
    process.env = {
      ...oldEnv,
      tableName: 'testTableName',
    };
  });

  afterEach(() => {
    process.env = oldEnv;
  });

  it('fetches from dynamo using parsed query', async () => {
    const payload = {
      text: 'status=accepted',
    };
    dynamodb.query.mockResolvedValue({
      Items: [],
    });
    await handler(payload);
    expect(dynamodb.query).toBeCalledWith(
      expect.objectContaining({
        TableName: 'testTableName',
        IndexName: 'BetStatusIndex',
        KeyConditionExpression: 'betStatus = :betStatus',
        ExpressionAttributeValues: {
          ':betStatus': 'accepted',
        },
      }),
    );
  });

  it('returns ephemeral error if status not provided', async () => {
    const payload = {
      text: '',
    };
    const response = await handler(payload);
    expect(response.response_type).toEqual('ephemeral');
    expect(response.text).toContain('Must filter on status');
  });

  it('builds bet list given the results', async () => {
    const payload = {
      text: 'status=accepted',
    };
    dynamodb.query.mockResolvedValue({
      Items: ['one', 'two'],
    });
    buildBetsList.mockReturnValue(['three', 'four']);
    const response = await handler(payload);
    expect(buildBetsList).toBeCalledWith(['one', 'two']);
    expect(response.response_type).toEqual('in_channel');
    expect(response.blocks).toEqual(['three', 'four']);
  });

  it('other filters ignored', async () => {
    const payload = {
      text: 'status=accepted foo bar=baz',
    };
    dynamodb.query.mockResolvedValue({
      Items: [],
    });
    await handler(payload);
    expect(dynamodb.query).toBeCalledWith(
      expect.objectContaining({
        ExpressionAttributeValues: {
          ':betStatus': 'accepted',
        },
      }),
    );
  });
});
