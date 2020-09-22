import types from '../types/interactiveTypes';
import proposalResponseHandler from './proposalResponse';
import winnerResponseHandler from './winnerResponse';
import handler from './index';

jest.mock('./proposalResponse');
jest.mock('./winnerResponse');

describe('interactiveHandler', () => {
  it('calls correct sub-handlers', async () => {
    const subHandlers = [
      { type: types.PROPOSAL_RESPONSE, handler: proposalResponseHandler },
      { type: types.WINNER_RESPONSE, handler: winnerResponseHandler },
    ];
    for (let i = 0; i < subHandlers.length; i++) {
      jest.resetAllMocks();
      const subHandler = subHandlers[i];
      const payload = {
        callback_id: `${subHandler.type}_suffix`,
      };
      await handler(payload);
      expect(subHandler.handler).toBeCalledWith(payload);
    }
  });

  it('throws error if no match', async () => {
    const payload = { callback_id: 'gibberish' };
    try {
      await handler(payload);
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeDefined();
      expect(proposalResponseHandler).not.toBeCalledWith(payload);
    }
  });
});
