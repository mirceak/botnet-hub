import { type IKernelModuleInit } from '#kernel/Kernel.js';
import { DataSource } from 'typeorm';
import { EntityModel } from '#database/entities/EntityModel.js';
import { GuardModel } from '#database/entities/GuardModel.js';
import { RemoteModuleModel } from '#database/entities/RemoteModuleModel.js';
import { RouteModel } from '#database/entities/RouteModel.js';
import { ScriptModel } from '#database/entities/ScriptModel.js';
import { UserModel } from '#database/entities/UserModel.js';
import { WebComponentModel } from '#database/entities/WebComponentModel.js';
import { WebRouteModel } from '#database/entities/WebRouteModel.js';

export const init: IKernelModuleInit = async (context) => {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: ':memory:',
    entities: [
      EntityModel,
      GuardModel,
      RemoteModuleModel,
      RouteModel,
      ScriptModel,
      UserModel,
      WebComponentModel,
      WebRouteModel
    ],
    synchronize: true,
    subscribers: [],
    migrations: []
  });

  await dataSource.initialize();

  context.kernelGlobals.dataSource = dataSource;
};
