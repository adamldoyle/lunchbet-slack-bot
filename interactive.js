import { parse } from 'querystring';
import { verifyRequest } from './libs/slack';
import handler from './libs/handler';
import interactiveHandler from './interactiveHandler';
import debug from './libs/debug';

export const main = handler(async (event) => {
  if (!verifyRequest(event)) {
    throw new Error('Invalid request');
  }

  const payload = JSON.parse(parse(event.body).payload);
  debug('payload', payload);
  debug('typeof', typeof payload);
  debug('keys', Object.keys(payload));
  debug('callback_id', payload.callback_id, payload['callback_id']);
  debug('type', payload.type, payload['type']);
  return interactiveHandler(payload);
});
