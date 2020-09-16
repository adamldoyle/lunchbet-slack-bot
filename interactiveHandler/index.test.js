import types from '../types/interactiveTypes';
import proposalResponseHandler from './proposalResponse';
import handler from './index';

jest.mock('./proposalResponse');

describe('interactiveHandler', () => {
  it('calls proposal handler when match', async () => {
    const payload = {
      callback_id: `${types.PROPOSAL_RESPONSE}_suffix`,
    };
    proposalResponseHandler.mockResolvedValue({ test: true });
    const response = await handler(payload);
    expect(response).toEqual({ test: true });
    expect(proposalResponseHandler).toBeCalledWith(payload);
  });

  it('throws error if no match', async () => {
    const payload = { callback_id: 'gibberish' };
    try {
      handler(payload);
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeDefined();
      expect(proposalResponseHandler).not.toBeCalledWith(payload);
    }
  });
});
