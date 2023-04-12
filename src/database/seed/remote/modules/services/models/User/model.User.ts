import { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

interface User {
  auth?: {
    token: string;
  };
  info?: {
    name: string;
    age: number;
  };
}

export const initModel = (mainScope: IMainScope) => {
  return mainScope.store.registerDynamicModule<User>(
    {
      info: {
        name: 'asd',
        age: 34
      }
    },
    'user'
  );
};
