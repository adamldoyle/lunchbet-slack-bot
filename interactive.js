import { parse } from 'querystring';
import { verifyRequest } from './libs/slack';
import handler from './libs/handler';
import debug from './libs/debug';
import interactiveHandler from './interactiveHandler';

export const main = handler(async (event) => {
  if (!verifyRequest(event)) {
    throw new Error('Invalid request');
  }

  const payload = parse(event.body);
  debug('parsed body', payload);
  debug('dot type', payload.type);
  debug('array type', payload['type']);
  debug('dot callback_id', payload.callback_id);
  debug('array callback_id', payload['callback_id']);
  return interactiveHandler(payload);
});
