import { jest as jestGlobals } from '@jest/globals';
const { spyOn } = import.meta.jest;

describe('greeter function', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(async () => {
    consoleLogSpy = spyOn(global.console, 'log');
    jestGlobals.unstable_mockModule('/src/kernel/Kernel.js', () => ({
      getKernel() {
        return {
          async runImports() {
            return {
              start() {}
            };
          }
        };
      }
    }));
    import('/src/kernel/Kernel.js');

    await import('/src/main.js');
  });
  afterAll(() => {
    consoleLogSpy.mockRestore();
    jestGlobals.resetModules();
  });

  it('logs "start" into the console', () => {
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenLastCalledWith(
      expect.stringMatching('start')
    );
  });
});
