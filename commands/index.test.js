import types from '../types/commandTypes';
import lunchbetHandler from './lunchbet';
import lunchbetsHandler from './lunchbets';
import handler from './index';

jest.mock('./lunchbet');
jest.mock('./lunchbets');

describe('commands handlers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('calls lunchbet handler when match', async () => {
    const payload = { command: types.LUNCHBET };
    lunchbetHandler.mockResolvedValue({ test: true });
    const response = await handler(payload);
    expect(response).toEqual({ test: true });
    expect(lunchbetHandler).toBeCalledWith(payload);
    expect(lunchbetsHandler).not.toBeCalled();
  });

  it('calls lunchbets handler when match', async () => {
    const payload = { command: types.LUNCHBETS };
    lunchbetsHandler.mockResolvedValue({ test: true });
    const response = await handler(payload);
    expect(response).toEqual({ test: true });
    expect(lunchbetHandler).not.toBeCalled();
    expect(lunchbetsHandler).toBeCalledWith(payload);
  });

  it('throws error for non-match', async () => {
    const pyaload = { command: 'gibberish' };
    try {
      await handler(payload);
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeDefined();
      expect(lunchbetHandler).not.toBeCalled();
      expect(lunchbetsHandler).not.toBeCalled();
    }
  });
});
