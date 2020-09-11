import types from './types';

export default async function (payload) {
  if (payload.command.toLowerCase() === types.LUNCHBET) {
    return {
      response_type: 'in_channel',
      text: 'Lunch bet proposed',
    };
  }

  throw new Error('Unknown command');
}
