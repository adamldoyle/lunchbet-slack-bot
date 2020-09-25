import types from '../types/interactiveTypes';
import proposalResponseHandler from './proposalResponse';
import winnerResponseHandler from './winnerResponse';
import confirmationResponseHandler from './confirmationResponse';
import handler from './index';

jest.mock('./proposalResponse');
jest.mock('./winnerResponse');
jest.mock('./confirmationResponse');

describe('interactiveHandler', () => {
  const subHandlers = [
    { type: types.PROPOSAL_RESPONSE, handler: proposalResponseHandler },
    { type: types.WINNER_RESPONSE, handler: winnerResponseHandler },
    {
      type: types.CONFIRMATION_RESPONSE,
      handler: confirmationResponseHandler,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls correct sub-handlers', async () => {
    for (let i = 0; i < subHandlers.length; i++) {
      jest.resetAllMocks();
      const subHandler = subHandlers[i];
      const payload = {
        actions: [{ action_id: `${subHandler.type}_suffix` }],
      };
      await handler(payload);
      expect(subHandler.handler).toBeCalledWith(payload);
    }
  });

  it('calls correct sub-handlers with deprecated callback_id', async () => {
    const filteredSubHandlers = subHandlers.filter(
      (subHandler) =>
        subHandler.type === types.PROPOSAL_RESPONSE ||
        subHandler.type === types.WINNER_RESPONSE,
    );
    for (let i = 0; i < filteredSubHandlers.length; i++) {
      jest.resetAllMocks();
      const subHandler = filteredSubHandlers[i];
      const payload = {
        callback_id: `${subHandler.type}_suffix`,
      };
      await handler(payload);
      expect(subHandler.handler).toBeCalledWith(payload);
    }
  });

  it('throws error if no match', async () => {
    const payload = { actions: [{ action_id: 'gibberish' }] };
    try {
      await handler(payload);
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeDefined();
      subHandlers.forEach((subHandler) => {
        expect(subHandler.handler).not.toBeCalled();
      });
    }
  });

  it('throws error if no action', async () => {
    const payload = {};
    try {
      await handler(payload);
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeDefined();
      subHandlers.forEach((subHandler) => {
        expect(subHandler.handler).not.toBeCalled();
      });
    }
  });
});
