import { type Script as ScriptModel } from '@database/entities/Script.js';
import { SourceTextModule, createContext } from 'node:vm';
import { type IKernelGlobals } from '@src/kernel/Kernel.js';

export type linker = (specifier: string) => Promise<void>;

export interface Exports {
  nextImportContext?: Record<string, unknown>;
  [x: string]: unknown;
}

export interface Module extends SourceTextModule {
  link: (linker: linker) => Promise<void>;
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
  returnModule?: true,
): Promise<Record<string, unknown> | SourceTextModule> => {
  if (!context.kernelGlobals.remoteModules[moduleInstance.name]) {
    context.exports = {} as Exports;
    const compiled = new SourceTextModule(moduleInstance.code, {
      identifier: `Remote Module: "${moduleInstance.name}.js"`,
      context: createContext(Object.assign(context, globalContext)),
      async importModuleDynamically(specifier) {
        if (specifier.indexOf('./') !== -1) {
          if (specifier.includes('./node_modules/')) {
            // node_modules imports
            return import(specifier.split('./node_modules/').pop());
          }

          const importContext = context.exports.nextImportContext ?? context;
          delete context.exports.nextImportContext;
          return await context.kernelGlobals.loadAndImportRemoteModule(
            '@remoteModules/' + specifier.split('./').pop(),
            importContext,
            true,
          );
        }

        // TODO: if rendering on the server make sure to record an array with the codes for all modules and their paths and use this to hydrate

        // node_modules imports
        return import(specifier);
      },
    });
    await compiled.link(defaultLinker);
    await compiled.evaluate();
    context.kernelGlobals.remoteModules[moduleInstance.name] = returnModule
      ? compiled
      : ({
          exports: context.exports,
        } as Module);
    return returnModule ? compiled : await context.exports;
  } else {
    return returnModule
      ? context.kernelGlobals.remoteModules[moduleInstance.name]
      : await context.kernelGlobals.remoteModules[moduleInstance.name].exports;
  }
};

const globalContext = {
  console,
  process,
  setInterval,
  setTimeout,
  clearInterval,
  clearTimeout,
};
