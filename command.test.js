import { verifyRequest } from './libs/slack';
import { main } from './command';

jest.mock('./libs/slack');

describe('command handler', () => {
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
  });

  it('other events throw error', async () => {
    const event = {
      body: 'command=/gibberish',
    };
    const context = { context: true };
    verifyRequest.mockReturnValue(true);
    try {
      await main(event, context);
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});
