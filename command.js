import { parse } from 'querystring';
import { verifyRequest } from './libs/slack';
import handler from './libs/handler';
import commandsHandler from './commands';

export const main = handler(async (event) => {
  if (!verifyRequest(event)) {
    throw new Error('Invalid request');
  }

  const payload = parse(event.body);
  return commandsHandler(payload);
});
