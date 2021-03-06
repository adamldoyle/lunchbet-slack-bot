import { parse } from 'querystring';
import { verifyRequest } from './libs/slack';
import handler from './libs/handler';
import interactiveHandler from './interactiveHandler';

export const main = handler(async (event) => {
  if (!verifyRequest(event)) {
    throw new Error('Invalid request');
  }

  const payload = JSON.parse(parse(event.body).payload);
  return interactiveHandler(payload);
});
