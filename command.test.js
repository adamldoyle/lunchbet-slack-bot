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

  it('reflects challenge for url_verification', async () => {
    const event = {
      body: JSON.stringify({
        type: 'url_verification',
        challenge: 'testChallenge',
      }),
    };
    const context = { context: true };
    verifyRequest.mockReturnValue(true);
    const response = await main(event, context);
    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body)).toEqual({ challenge: 'testChallenge' });
  });

  it('other events just return true', async () => {
    const event = {
      body: JSON.stringify({
        type: 'gibberish',
      }),
    };
    const context = { context: true };
    verifyRequest.mockReturnValue(true);
    const response = await main(event, context);
    expect(response.statusCode).toEqual(200);
    expect(JSON.parse(response.body)).toEqual(true);
  });
});
