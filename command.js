import handler from './libs/handler';
import { verifyRequest } from './libs/slack';

export const main = handler(async (event) => {
  const payload = JSON.parse(event.body);

  if (!verifyRequest(event)) {
    throw new Error('Invalid request');
  }

  if (payload.type === 'url_verification') {
    return { challenge: payload.challenge };
  }

  return true;
});
