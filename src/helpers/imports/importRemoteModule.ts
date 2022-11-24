import { type Script as ScriptModel } from '@database/entities/Script.js';
import { SourceTextModule, createContext } from 'node:vm';
import crypto from 'crypto';
import { type IKernelGlobals } from '@src/kernel/Kernel.js';

const modules: string[] = [];

export type linker = (specifier: string) => Promise<void>;

export interface Module {
  link: (linker: linker) => Promise<void>;
  evaluate: () => Promise<void>;
}

const defaultLinker = () => {
  throw new Error(`Use async imports instead!`);
};

export const importRemoteModule = async (
  moduleInstance: ScriptModel,
  context: {
    [x: string]: unknown;
    kernelGlobals?: IKernelGlobals;
  },
  refreshCopy = false,
): Promise<void> => {
  const moduleHash =
    crypto.createHash('sha256').update(moduleInstance.code).digest('hex') +
    moduleInstance.name;

  if (refreshCopy || modules.indexOf(moduleHash) === -1) {
    const compiled = new SourceTextModule(moduleInstance.code, {
      identifier: `Remote Module: "${moduleInstance.name}.js"`,
      context: createContext(Object.assign(context, globalContext)),
      async importModuleDynamically(specifier) {
        return import(specifier);
      },
    });
    await compiled.link(defaultLinker);
    context.kernelGlobals.remoteModules.push(compiled);
    await compiled.evaluate();
    modules.push(moduleHash);
  } else {
    throw new Error('Module already imported');
  }
};

const globalContext = {
  Object: {
    ...Object,
    prototype: {},
    getPrototypeOf() {
      return this.prototype;
    },
  },
  console,
};
