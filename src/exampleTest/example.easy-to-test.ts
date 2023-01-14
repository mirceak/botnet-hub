export enum Delays {
  Short = 1000,
  Medium = 3000,
  Long = 6000
}

const delayCallback = async <CallbackType extends CallableFunction>(
  callback: CallbackType,
  delay: number = Delays.Medium
): Promise<void> => {
  return new Promise((resolve) =>
    setTimeout(() => resolve(callback() as void), delay)
  );
};

export const sayHey = async (name: string, delay?: number): Promise<void> => {
  await delayCallback(
    () => console.log(`Hey ${name}, the world says hello!`),
    delay
  );
};
