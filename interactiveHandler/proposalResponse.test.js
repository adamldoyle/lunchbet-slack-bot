import types from '../types/interactiveTypes';
import status from '../types/commandStatuses';
import dynamodb from '../libs/dynamodb';
import slackClient, { getUserMap } from '../libs/slack';
import {
  sendBetAccepted,
  buildBetInitialBlocks,
  buildBetProposalBlocks,
} from '../libs/slackMessages';
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
      actions: [
        {
          value: newStatus,
          action_id: `${types.PROPOSAL_RESPONSE}:123:${newStatus}`,
        },
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

  it('can pull bet id from callback_id', async () => {
    const payload = {
      callback_id: 'proposal_response_123',
      actions: [{ value: status.ACCEPTED }],
      user: { id: '456' },
      channel: { id: '789' },
    };
    dynamodb.update.mockResolvedValue({ Attributes: {} });
    await handler(payload);
    expect(dynamodb.update).toBeCalledWith(
      expect.objectContaining({
        Key: { betId: '123' },
      }),
    );
  });

  it('invalid status throws error', async () => {
    const payload = {
      actions: [
        {
          value: status.WON,
          action_id: `${types.PROPOSAL_RESPONSE}:123:${status.WON}`,
        },
      ],
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

  async function testSlackUpdateToOther(newStatus, expectedPrefix, builder) {
    const payload = {
      actions: [
        {
          value: newStatus,
          action_id: `${types.PROPOSAL_RESPONSE}:123:${newStatus}`,
        },
      ],
      user: { id: '456' },
      channel: { id: '789' },
    };
    const attributes = {
      creatorUserId: 'abc',
      targetUserId: 'def',
      creatorChannel: 'channelAbc',
      targetChannel: 'channelDef',
      creatorInitialTs: 'tsAbc',
      targetInitialTs: 'tsDef',
    };
    dynamodb.update.mockResolvedValue({
      Attributes: attributes,
    });
    buildBetInitialBlocks.mockReturnValue([{ whatever: true }]);
    buildBetProposalBlocks.mockReturnValue([{ whatever: true }]);

    await handler(payload);

    expect(slackClient.chat.update).toBeCalledWith(
      expect.objectContaining({
        channel: attributes['creatorChannel'],
        ts: attributes['creatorInitialTs'],
        blocks: [{ whatever: true }],
      }),
    );
    expect(buildBetInitialBlocks).toBeCalledWith(attributes);

    expect(slackClient.chat.update).toBeCalledWith(
      expect.objectContaining({
        channel: attributes['targetChannel'],
        ts: attributes['targetInitialTs'],
        blocks: [{ whatever: true }],
      }),
    );
    expect(buildBetProposalBlocks).toBeCalledWith(attributes);
  }

  it('sends slack message to update other user', async () => {
    jest.clearAllMocks();
    await testSlackUpdateToOther(
      status.ACCEPTED,
      'creator',
      buildBetInitialBlocks,
    );
    jest.clearAllMocks();
    await testSlackUpdateToOther(
      status.DECLINED,
      'creator',
      buildBetInitialBlocks,
    );
    jest.clearAllMocks();
    await testSlackUpdateToOther(
      status.CANCELED,
      'target',
      buildBetProposalBlocks,
    );
  });

  it('new acceptance messages sent on accept and saves timestamps', async () => {
    const payload = {
      actions: [
        {
          value: status.ACCEPTED,
          action_id: `${types.PROPOSAL_RESPONSE}:123:${status.ACCEPTED}`,
        },
      ],
      user: { id: 'abc' },
      channel: { id: '789' },
    };
    const attributes = {
      creatorUserId: 'abc',
      targetUserId: 'def',
      creatorChannel: 'channelAbc',
      targetChannel: 'channelDef',
    };
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
      'channelAbc',
      '0',
    );
    expect(sendBetAccepted).toBeCalledWith(
      attributes,
      'UserABC',
      'UserDEF',
      'channelDef',
      '1',
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
      actions: [
        {
          value: status.DECLINED,
          action_id: `${types.PROPOSAL_RESPONSE}:123:${status.DECLINED}`,
        },
      ],
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
