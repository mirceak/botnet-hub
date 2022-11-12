const { spyOn } = import.meta.jest;

describe('greeter function', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(async () => {
    consoleLogSpy = spyOn(global.console, 'log');
    await import('./main.js');
  });

  it('logs "start" into the console', () => {
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenLastCalledWith(
      expect.stringMatching('start'),
    );
  });
});
