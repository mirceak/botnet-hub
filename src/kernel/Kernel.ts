import { type Express } from 'express';
import { type Sequelize } from 'sequelize';
import { Composable } from '@database/entities/Composable.js';
import {
  importRemoteModule,
  Module,
} from '@helpers/imports/importRemoteModule.js';
import { useHasOneMixin } from '@kc/HasOneMixin.js';

useHasOneMixin;
export interface IKernel {
  runImports: (queue?: Promise<IKernelModule>[]) => Promise<IKernel>;
  start: () => Promise<void>;
  globals: IKernelGlobals;
}

export interface IKernelGlobals {
  modules: IKernelModule[];
  remoteModules: Module[];
  express?: Express;
  sequelize?: Sequelize;
}

export interface IKernelModule {
  init: IKernelModuleInit;
}

export type IKernelModuleInit = (context: IKernel) => Promise<void>;

const kernel: IKernel = ((loadQueue: Promise<IKernelModule>[]): IKernel => {
  return {
    async runImports(queue = loadQueue) {
      if (queue.length === 0) {
        throw new Error('Load Queue Empty');
      }
      for (const currentImport of queue) {
        kernel.globals.modules.push(await currentImport);
        await kernel.globals.modules[kernel.globals.modules.length - 1].init(
          kernel,
        );
      }
      queue.splice(0, queue.length);
      return this;
    },
    async start() {
      await Composable.findOne({
        where: {
          name: 'mainRemote',
        },
      }).then(async (composable) => {
        return await importRemoteModule(
          await composable.scriptEntity.getEntity(),
          { kernel },
        );
      });
    },
    globals: {
      modules: [],
      remoteModules: [],
    },
  };
})([
  import('@database/database.js'),
  import('@remote/server/server.js'),
  import('@database/seed/seeder.js'),
]);

export const useKernel = () => {
  if (kernel.globals.modules?.length)
    throw new Error('Restricted access. Use injection system!');
  return kernel;
};
