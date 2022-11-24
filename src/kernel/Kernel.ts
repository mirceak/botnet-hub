import { type Express } from 'express';
import { type Sequelize } from 'sequelize';
import { Composable } from '@database/entities/Composable.js';
import {
  importRemoteModule,
  type Module,
} from '@helpers/imports/importRemoteModule.js';
import { Script } from '@database/entities/Script.js';
import { Context } from 'node:vm';

export interface IKernel {
  runImports: (queue?: Promise<IKernelModule>[]) => Promise<IKernel>;
  start: () => Promise<void>;
  kernelGlobals: IKernelGlobals;
}

export interface IKernelGlobals {
  modules: IKernelModule[];
  remoteModules: Module[];
  importModule: <T>(path: string) => Promise<T>;
  loadRemoteModule: (name: string) => Promise<IRemoteModuleModel>;
  loadAndImportRemoteModule: (
    name: string,
    context?: Context,
  ) => Promise<IRemoteModuleModel>;
  importRemoteModule: (
    remoteModuleModel: IRemoteModuleModel,
    context?: Context,
  ) => Promise<void>;
  express?: Express;
  sequelize?: Sequelize;
}

export interface IKernelModule {
  init: IKernelModuleInit;
}

export interface IRemoteModuleModel {
  script?: Script;
  composable?: Composable;
}

export type IKernelModuleInit = (context: IKernel) => Promise<void>;

const defaultModules = [
  import('@database/database.js'),
  import('@remote/server/server.js'),
  import('@database/seed/seeder.js'),
];

const composableScriptCache: Record<string, IRemoteModuleModel> = {};

const useKernel = (loadQueue: Promise<IKernelModule>[]): IKernel => {
  return {
    async runImports(queue = loadQueue) {
      if (queue.length === 0) {
        throw new Error('Load Queue Empty');
      }
      for (const currentImport of queue) {
        kernel.kernelGlobals.modules.push(await currentImport);
        await kernel.kernelGlobals.modules[
          kernel.kernelGlobals.modules.length - 1
        ].init(kernel);
      }
      queue.splice(0, queue.length);
      return this;
    },
    async start() {
      await this.kernelGlobals.loadAndImportRemoteModule('mainRemote');
    },
    kernelGlobals: {
      async importModule<T>(path: string): Promise<T> {
        return import(path);
      },
      async loadAndImportRemoteModule(
        name,
        context,
      ): Promise<IRemoteModuleModel> {
        const remoteModuleModel = await this.loadRemoteModule(name);
        await this.importRemoteModule(remoteModuleModel, context);
        return remoteModuleModel;
      },
      async loadRemoteModule(name: string): Promise<IRemoteModuleModel> {
        if (!composableScriptCache[name]) {
          const composable = await Composable.findOne({
            where: {
              name,
            },
          });
          composableScriptCache[name] = {
            composable,
            script: await composable.scriptEntity.getEntity(),
          };
        }
        return composableScriptCache[name];
      },
      async importRemoteModule(
        remoteModuleModel: IRemoteModuleModel,
        context,
      ): Promise<void> {
        return await importRemoteModule(
          remoteModuleModel.script,
          Object.assign(
            {
              kernelGlobals: kernel.kernelGlobals,
            },
            context,
          ),
        );
      },
      modules: [],
      remoteModules: [],
    },
  };
};

const kernel: IKernel = useKernel(defaultModules);

export const getKernel = () => {
  if (kernel.kernelGlobals.modules?.length)
    throw new Error('Restricted access. Use injection system!');
  return kernel;
};
