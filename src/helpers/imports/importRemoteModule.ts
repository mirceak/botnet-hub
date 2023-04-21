import { type ScriptModel } from '#database/entities/ScriptModel.js';
import { createContext } from 'node:vm';
import { type IKernelGlobals } from '#src/kernel/Kernel.js';
import { ModuleLinker, SourceTextModuleOptions, SourceTextModule } from 'vm';

export interface Exports {
  nextImportContext?: Record<string, unknown>;
  [x: string]: unknown;
}

export interface Module extends SourceTextModule {
  link: (linker: ModuleLinker) => Promise<void>;
  evaluate: () => Promise<void>;
  exports?: Exports;
}

const defaultLinker = () => {
  throw new Error(`Use async imports instead!`);
};

export const importRemoteModule = async (
  moduleInstance: ScriptModel,
  context: {
    [x: string]: unknown;
    exports?: Exports;
    kernelGlobals?: IKernelGlobals;
  },
  returnModule?: true
): Promise<Record<string, unknown> | SourceTextModule> => {
  if (
    context.kernelGlobals &&
    !context.kernelGlobals.remoteModules[moduleInstance.name]
  ) {
    context.exports = {} as Exports;
    context.fetch = async (specifier: string) => {
      /*file imports for backend*/
      return (await context.kernelGlobals?.loadRemoteModule(specifier))?.script
        ?.code;
    };
    const compiled = new SourceTextModule(moduleInstance.code, {
      identifier: `Remote Module: "${moduleInstance.name}"`,
      context: createContext(Object.assign(context, globalContext)),
      importModuleDynamically: ((specifier: string) => {
        if (specifier.indexOf('./') !== -1) {
          const importContext = context.exports?.nextImportContext ?? context;
          delete context.exports?.nextImportContext;
          return context.kernelGlobals?.loadAndImportRemoteModule(
            `#remoteModules/${specifier.split('./').pop() || ''}`,
            importContext,
            true
          );
        }
        // naked imports for backend
        return import(specifier);
      }) as unknown as SourceTextModuleOptions['importModuleDynamically']
    });
    await compiled.link(defaultLinker);
    await compiled.evaluate();
    if (context.kernelGlobals) {
      context.kernelGlobals.remoteModules[moduleInstance.name] = returnModule
        ? (compiled as never)
        : ({
            exports: context.exports
          } as Module);
    }
    return returnModule ? compiled : context.exports;
  } else {
    if (context.kernelGlobals) {
      return returnModule
        ? (context.kernelGlobals.remoteModules[moduleInstance.name] as never)
        : (context.kernelGlobals.remoteModules[moduleInstance.name]
            .exports as never);
    }
    throw new Error('kernel globals object is missing');
  }
};
const globalContext = {
  console,
  process,
  setInterval,
  setTimeout,
  clearInterval,
  clearTimeout
};
