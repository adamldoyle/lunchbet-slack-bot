import types from '../types/eventTypes';
import SlackClient from '../libs/slack';

export async function handleSource(payload) {
  await SlackClient.chat.postMessage({
    text: 'Source: https://github.com/adamldoyle/lunchbet-slack-bot',
    channel: payload.event.channel,
  });
  return true;
}

export async function handleHelp(payload) {
  await SlackClient.chat.postMessage({
    text: `Available commands: ${Object.values(types)
      .sort()
      .map((type) => `"${type}"`)
      .join(', ')}`,
    channel: payload.event.channel,
  });
  return true;
}
