import { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

export default async (mainScope: IMainScope) => {
  return {
    valueFromAsyncOrFunction: async <T>(val?: T): Promise<Awaited<T>> => {
      if (mainScope.helpers.validationsProto.isAsyncOrFunction(val)) {
        return (await val()) as Awaited<T>;
      }
      return (await val) as Awaited<T>;
    }
  };
};
