const { sayHey, Delays } = await import('./example.js');
const { useFakeTimers, spyOn, runOnlyPendingTimers } = import.meta.jest;

describe('sayHey function', () => {
  const name = 'John';

  let consoleLogSpy: jest.SpyInstance;
  let timeoutSpy: jest.SpyInstance;

  beforeAll(async () => {
    useFakeTimers();
    timeoutSpy = spyOn(global, 'setTimeout');
    consoleLogSpy = spyOn(global.console, 'log');

    sayHey(name);
    runOnlyPendingTimers();
  });

  afterAll(() => {
    timeoutSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('default delay is 3 seconds', () => {
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(
      expect.any(Function),
      Delays.Medium,
    );
  });

  it('greets a user with `Hello, {name}, the world says hello` message', () => {
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenLastCalledWith(
      expect.stringMatching('Hey John, the world says hello!'),
    );
  });
});
