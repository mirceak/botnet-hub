interface ModuleUser {
  readonly name: 'user';
  data: Data;
}

interface Data {
  auth?: {
    token: string;
  };
  info?: {
    name: string;
    age: number;
  };
}

export const getModel = (): ModuleUser => {
  return {
    name: 'user',
    data: {
      info: {
        name: 'asd',
        age: 34
      }
    }
  };
};
