import {
  importRemoteModule,
  type Module
} from '#helpers/imports/importRemoteModule.js';
import { Context } from 'node:vm';
import { getFileContentsSync } from '#helpers/imports/io.js';
import type { DataSource } from 'typeorm';
import { ScriptModel } from '#database/entities/ScriptModel.js';
import { RemoteModuleModel } from '#database/entities/RemoteModuleModel.js';

export interface IKernel {
  runImports: (queue?: Promise<IKernelModule>[]) => Promise<IKernel>;
  start: () => Promise<void>;
  kernelGlobals: IKernelGlobals;
}

export interface IKernelBackendWorkerLoad {
  payload: unknown;
  callback?: (data: string) => void;
}

export interface IKernelBackendWorker {
  runJob: (load: IKernelBackendWorkerLoad) => void;
}

export interface IKernelGlobals {
  modules: IKernelModule[];
  remoteModules: Record<string, Module>;
  loadRemoteModule: (name: string) => Promise<IRemoteModuleModel>;
  getFileContentsSync: (filePath: string) => string;
  importRemoteModule: (
    remoteModuleModel: IRemoteModuleModel,
    context?: Context,
    returnModule?: true
  ) => Promise<Record<string, unknown>>;
  loadAndImportRemoteModule: (
    name: string,
    context?: Context,
    returnModule?: true
  ) => Promise<Record<string, unknown>>;
  dataSource?: DataSource;
  backendWorkers: Record<string, IKernelBackendWorker>;
  exports?: Record<string, unknown>;
}

export interface IKernelModule {
  init: IKernelModuleInit;
}

export interface IRemoteModuleModel {
  script?: ScriptModel;
  remoteModule?: RemoteModuleModel;
}

export type IKernelModuleInit = (context: IKernel) => Promise<void> | void;

const defaultModules = [
  import('#database/database.js'),
  import('#database/seed/seeder.js')
];

const remoteModuleScriptCache: Record<string, IRemoteModuleModel> = {};

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
      await this.kernelGlobals.loadAndImportRemoteModule(
        '#remoteModules/mainRemote.js'
      );
    },
    kernelGlobals: {
      async loadAndImportRemoteModule(
        name,
        context,
        returnModule
      ): Promise<Record<string, unknown>> {
        const remoteModuleModel = await this.loadRemoteModule(name);
        return await this.importRemoteModule(
          remoteModuleModel,
          context,
          returnModule
        );
      },
      async loadRemoteModule(name: string): Promise<IRemoteModuleModel> {
        if (!remoteModuleScriptCache[name]) {
          const remoteModule = await this.dataSource?.manager.findOne(
            RemoteModuleModel,
            {
              where: {
                name
              }
            }
          );
          if (remoteModule) {
            remoteModuleScriptCache[name] = {
              remoteModule,
              script: await remoteModule.script
            };
          }
        }
        return remoteModuleScriptCache[name];
      },
      async importRemoteModule(
        remoteModuleModel: IRemoteModuleModel,
        context,
        returnModule
      ): Promise<Record<string, unknown>> {
        return (await importRemoteModule(
          remoteModuleModel.script as ScriptModel,
          Object.assign(
            {
              kernelGlobals: kernel.kernelGlobals
            },
            context
          ),
          returnModule
        )) as Record<string, unknown>;
      },
      modules: [],
      remoteModules: {},
      backendWorkers: {},
      getFileContentsSync
    }
  };
};

const kernel: IKernel = useKernel(defaultModules);

export const getKernel = () => {
  if (kernel.kernelGlobals.modules?.length)
    throw new Error('Restricted access. Use injection system!');
  return kernel;
};
