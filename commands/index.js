import types from './types';
import lunchbetHandler from './lunchbet';

export default async function (payload) {
  if (payload.command.toLowerCase() === types.LUNCHBET) {
    return lunchbetHandler(payload);
  }

  throw new Error('Unknown command');
}
