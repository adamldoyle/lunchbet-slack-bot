import types from '../types/interactiveTypes';
import status from '../types/commandStatuses';
import dynamodb from '../libs/dynamodb';
import slackClient, { getUserMap } from '../libs/slack';
import { sendBetAccepted } from '../libs/slackMessages';
import handler from './proposalResponse';

jest.mock('../libs/dynamodb');
jest.mock('../libs/slack');
jest.mock('../libs/slackMessages');

describe('proposalResponseHandler', () => {
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

  async function testDbUpdate(newStatus, expectedUserField) {
    const payload = {
      actions: [{ value: newStatus }],
      callback_id: `${types.PROPOSAL_RESPONSE}_123`,
      user: { id: '456' },
      channel: { id: '789' },
    };
    dynamodb.update.mockResolvedValue({ Attributes: {} });
    await handler(payload);
    expect(dynamodb.update).toBeCalledWith(
      expect.objectContaining({
        TableName: 'testTableName',
        Key: { betId: '123' },
        ConditionExpression: `${expectedUserField} = :userId AND betStatus = :requiredStatus`,
        UpdateExpression: 'SET betStatus = :betStatus',
        ExpressionAttributeValues: {
          ':userId': '456',
          ':requiredStatus': status.PROPOSED,
          ':betStatus': newStatus,
        },
        ReturnValues: 'ALL_NEW',
      }),
    );
  }

  it('updates status in db', async () => {
    await testDbUpdate(status.ACCEPTED, 'targetUserId');
    await testDbUpdate(status.DECLINED, 'targetUserId');
    await testDbUpdate(status.CANCELED, 'creatorUserId');
  });

  it('invalid status throws error', async () => {
    const payload = {
      actions: [{ value: status.WON }],
      callback_id: `${types.PROPOSAL_RESPONSE}_123`,
      user: { id: '456' },
      channel: { id: '789' },
    };
    try {
      await handler(payload);
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeDefined();
    }
  });

  async function testSlackUpdateToOther(newStatus, expectedFieldName) {
    const payload = {
      actions: [{ value: newStatus }],
      callback_id: `${types.PROPOSAL_RESPONSE}_123`,
      user: { id: '456' },
      channel: { id: '789' },
    };
    const attributes = { creatorUserId: 'abc', targetUserId: 'def' };
    dynamodb.update.mockResolvedValue({
      Attributes: attributes,
    });
    await handler(payload);
    expect(slackClient.chat.update).toBeCalledWith(
      expect.objectContaining({
        channel: payload.channel.id,
        ts: attributes[expectedFieldName],
      }),
    );
    const attachments = JSON.stringify(
      slackClient.chat.update.mock.calls[0][0].attachments,
    );
    expect(attachments).toContain(`Bet *${newStatus}`);
  }

  it('sends slack message to update other user', async () => {
    jest.clearAllMocks();
    await testSlackUpdateToOther(status.ACCEPTED, 'initialTs');
    jest.clearAllMocks();
    await testSlackUpdateToOther(status.DECLINED, 'initialTs');
    jest.clearAllMocks();
    await testSlackUpdateToOther(status.CANCELED, 'proposalTs');
  });

  async function testSlackUpdateToUser(newStatus) {
    const payload = {
      actions: [{ value: newStatus }],
      callback_id: `${types.PROPOSAL_RESPONSE}_123`,
      user: { id: '456' },
      channel: { id: '789' },
    };
    dynamodb.update.mockResolvedValue({
      Attributes: { initialTs: 'abc' },
    });
    const response = await handler(payload);
    const attachments = JSON.stringify(response.attachments);
    expect(attachments).toContain(`Bet *${newStatus}*`);
  }

  it('returns slack update to user', async () => {
    await testSlackUpdateToUser(status.ACCEPTED);
    await testSlackUpdateToUser(status.DECLINED);
    await testSlackUpdateToUser(status.CANCELED);
  });

  it('new acceptance messages sent on accept and saves timestamps', async () => {
    const payload = {
      actions: [{ value: status.ACCEPTED }],
      callback_id: `${types.PROPOSAL_RESPONSE}_123`,
      user: { id: 'abc' },
      channel: { id: '789' },
    };
    const attributes = { creatorUserId: 'abc', targetUserId: 'def' };
    dynamodb.update.mockResolvedValue({
      Attributes: attributes,
    });
    getUserMap.mockResolvedValue({ abc: 'UserABC', def: 'UserDEF' });
    sendBetAccepted.mockResolvedValueOnce(3).mockResolvedValueOnce(4);
    await handler(payload);
    expect(getUserMap).toBeCalled();
    expect(sendBetAccepted).toBeCalledWith(
      attributes,
      'UserABC',
      'UserDEF',
      'abc',
    );
    expect(sendBetAccepted).toBeCalledWith(
      attributes,
      'UserABC',
      'UserDEF',
      'def',
    );

    expect(dynamodb.update).toBeCalledWith(
      expect.objectContaining({
        TableName: 'testTableName',
        Key: {
          betId: '123',
        },
        UpdateExpression:
          'SET creatorAcceptTs = :creatorAcceptTs, targetAcceptTs = :targetAcceptTs',
        ExpressionAttributeValues: {
          ':creatorAcceptTs': 3,
          ':targetAcceptTs': 4,
        },
      }),
    );
  });

  it('does not send acceptance message for non-accept', async () => {
    const payload = {
      actions: [{ value: status.DECLINED }],
      callback_id: `${types.PROPOSAL_RESPONSE}_123`,
      user: { id: 'abc' },
      channel: { id: '789' },
    };
    const attributes = { creatorUserId: 'abc', targetUserId: 'def' };
    dynamodb.update.mockResolvedValue({
      Attributes: attributes,
    });
    await handler(payload);
    expect(sendBetAccepted).not.toBeCalled();
  });
});
