import types from './types';
import proposalResponseHandler from './proposalResponse';

export default async function (payload) {
  if (payload.callback_id.startsWith(types.PROPOSAL_RESPONSE)) {
    return proposalResponseHandler(payload);
  }
}
