/**
 * Some predefined delay values (in milliseconds).
 */
export enum Delays {
  Short = 1000,
  Medium = 3000,
  Long = 6000,
}

/**
 * Returns a Promise<void> that resolves after a given time.
 *
 * @param callback A callback function.
 * @param delay A number of milliseconds to delay resolution of the Promise.
 * @returns A delayed adaptation of the given input.
 */
const delayCallback = async <CallbackType extends CallableFunction>(
  callback: CallbackType,
  delay: number = Delays.Medium,
): Promise<void> => {
  return new Promise((resolve) => setTimeout(() => resolve(callback()), delay));
};

export const sayHey = async (name: string, delay?: number): Promise<void> => {
  await delayCallback(
    () => console.log(`Hey ${name}, the world says hello!`),
    delay,
  );
};
