import types from '../types/interactiveTypes';
import proposalResponseHandler from './proposalResponse';
import winnerResponseHandler from './winnerResponse';

export default async function (payload) {
  if (payload?.actions?.[0]?.action_id?.startsWith(types.PROPOSAL_RESPONSE)) {
    return proposalResponseHandler(payload);
  }

  if (payload?.actions?.[0]?.action_id?.startsWith(types.WINNER_RESPONSE)) {
    return winnerResponseHandler(payload);
  }

  throw new Error('Unknown interactive');
}
