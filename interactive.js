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
  return interactiveHandler(payload);
});
