import { verifyRequest } from './libs/slack';
import { main } from './interactive';
import interactiveHandler from './interactiveHandler';

jest.mock('./libs/slack');
jest.mock('./interactiveHandler');

describe('interactive handler', () => {
  it('verifies requests', async () => {
    const event = { body: null };
    const context = { context: true };
    verifyRequest.mockReturnValue(false);
    try {
      await main(event, context);
      expect(false).toBeTruthy();
    } catch (err) {
      expect(true).toBeTruthy();
    }
    expect(verifyRequest).toBeCalledWith(event);
    expect(interactiveHandler).not.toBeCalled();
  });

  it('other events throw error', async () => {
    const payload = {
      callback_id: 'gibberish',
      other: true,
    };
    const event = {
      body: `payload=${JSON.stringify(payload)}`,
    };
    const context = { context: true };
    verifyRequest.mockReturnValue(true);
    await main(event, context);
    expect(interactiveHandler).toBeCalledWith(payload);
    console.log(interactiveHandler.mock.calls[0]);
  });
});
