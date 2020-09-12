import types from './types';

const re = /^<@(?<userId>.*)\|(?<userName>.*)>\s*(?<lunchCount>[0-9]+)\s*(?<description>.*)$/;

export default async function (payload) {
  const matches = payload.text.trim().match(re);
  if (!matches) {
    return {
      response_type: 'ephemeral',
      text: `Invalid syntax: ${types.LUNCHBET} [@user] [# of lunches] [short bet description]`,
    };
  }
  const { userId, userName, lunchCount, description } = matches.groups;
  return {
    response_type: 'in_channel',
    text: `Lunch bet proposed: ${userId} ${userName} ${lunchCount} ${description}`,
  };
}
