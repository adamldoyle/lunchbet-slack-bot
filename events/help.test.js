import SlackClient from '../libs/slack';
import { handleSource, handleHelp } from './help';

jest.mock('../libs/slack');

describe('help', () => {
  describe('handleSource', () => {
    it('outputs repository', async () => {
      const payload = {
        event: {
          channel: 'testChannel',
        },
      };
      const result = await handleSource(payload);
      expect(SlackClient.chat.postMessage).toBeCalledWith({
        channel: 'testChannel',
        text: 'Source: https://github.com/adamldoyle/lunchbet-slack-bot',
      });
    });
  });

  describe('handleHelp', () => {
    it('outputs help', async () => {
      const payload = {
        event: {
          channel: 'testChannel',
        },
      };
      const result = await handleHelp(payload);
      expect(SlackClient.chat.postMessage).toBeCalledWith({
        channel: 'testChannel',
        text: 'Available commands: "help", "source"',
      });
    });
  });
});
