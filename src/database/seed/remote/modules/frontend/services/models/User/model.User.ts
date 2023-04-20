import { UserModel } from '/src/database/entities/UserModel.js';

export interface ModuleUser {
  readonly name: 'user';
  data: Data;
}

export interface Data extends UserModel {
  auth?: {
    token: string;
  };
}

export const getModel = (): ModuleUser => {
  return {
    name: 'user',
    data: {
      name: 'asd',
      password: 'asd',
      email: '34'
    }
  } satisfies ModuleUser;
};
