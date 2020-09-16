import types from '../types/commandTypes';
import lunchbetHandler from './lunchbet';
import lunchbetsHandler from './lunchbets';

export default async function (payload) {
  const command = payload.command.toLowerCase();
  if (command === types.LUNCHBET) {
    return lunchbetHandler(payload);
  }
  if (command === types.LUNCHBETS) {
    return lunchbetsHandler(payload);
  }

  throw new Error('Unknown command');
}
