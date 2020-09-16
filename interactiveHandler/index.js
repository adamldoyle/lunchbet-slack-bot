import types from '../types/interactiveTypes';
import proposalResponseHandler from './proposalResponse';

export default async function (payload) {
  if (payload.callback_id.startsWith(types.PROPOSAL_RESPONSE)) {
    return proposalResponseHandler(payload);
  }

  throw new Error('Unknown interactive');
}
