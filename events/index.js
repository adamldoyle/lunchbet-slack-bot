import types from './types';
import { handleSource, handleHelp } from './help';

export default async function handleEvent(payload) {
  if (payload.event.type === 'app_mention') {
    const text = payload.event.text;
    if (text.includes(types.SOURCE)) {
      return handleSource(payload);
    }
    if (text.includes(types.HELP)) {
      return handleHelp(payload);
    }
  }
}
