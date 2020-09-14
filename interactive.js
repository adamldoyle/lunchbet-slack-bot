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
  return interactiveHandler(payload);
});
