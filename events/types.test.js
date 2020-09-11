import types from './types';

describe('types', () => {
  it('contains help', () => {
    expect(types.HELP).toEqual('help');
  });

  it('contains source', () => {
    expect(types.SOURCE).toEqual('source');
  });
});
