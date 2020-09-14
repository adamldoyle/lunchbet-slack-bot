import handler from './libs/handler';
import { verifyRequest } from './libs/slack';
import eventHandler from './events';
import interactiveHandler from './interactive';

export const main = handler(async (event) => {
  if (!verifyRequest(event)) {
    throw new Error('Invalid request');
  }

  const payload = JSON.parse(event.body);

  if (payload.type === 'url_verification') {
    return { challenge: payload.challenge };
  }
  if (payload.type === 'event_callback') {
    return eventHandler(payload);
  }
  // TODO: Need to move interactive out because it's a form encoded body, not JSON
  if (payload.type === 'interactive_message') {
    return interactiveHandler(payload);
  }

  return true;
});
