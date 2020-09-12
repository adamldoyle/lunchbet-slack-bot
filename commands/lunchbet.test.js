import handler from './lunchbet';

describe('lunchbetHandler', () => {
  it('', async () => {
    await handler({
      text: '  <@testId|testName>   47    test bet description   ',
    });
  });
});
