import { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

export default async (mainScope: IMainScope) => {
  return {
    valueFromAsyncOrFunction: async <T, attrs extends unknown[]>(
      val: T,
      attrs?: attrs
    ): Promise<Awaited<T>> => {
      if (mainScope.helpers.validationsProto.isAsyncOrFunction(val)) {
        return (await val(...(attrs || []))) as Awaited<T>;
      }
      return (await val) as Awaited<T>;
    }
  };
};
