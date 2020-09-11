import { handleSource, handleHelp } from './help';
import eventHandler from './index';

jest.mock('./help');

describe('eventHandler', () => {
  it('non matching type skips handlers', async () => {
    const payload = {
      event: {
        type: 'gibberish',
        text: 'help',
      },
    };
    await eventHandler(payload);
    expect(handleSource).not.toBeCalled();
    expect(handleHelp).not.toBeCalled();
  });

  it('non matching app_mention skips handlers', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'gibberish',
      },
    };
    await eventHandler(payload);
    expect(handleSource).not.toBeCalled();
    expect(handleHelp).not.toBeCalled();
  });

  it('processes source messages', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'prefix source suffix',
      },
    };
    await eventHandler(payload);
    expect(handleSource).toBeCalled();
  });

  it('processes help messages', async () => {
    const payload = {
      event: {
        type: 'app_mention',
        text: 'prefix help suffix',
      },
    };
    await eventHandler(payload);
    expect(handleHelp).toBeCalled();
  });
});
