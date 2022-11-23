import { type Script as ScriptModel } from '@database/entities/Script.js';
import { SourceTextModule, createContext, type Context } from 'node:vm';
import crypto from 'crypto';
import { IKernel } from '@src/kernel/Kernel.js';
const modules: Record<string, Module> = {};

export type linker = (specifier: string) => Promise<void>;

export interface Module {
  link: (linker: linker) => Promise<void>;
  evaluate: () => Promise<void>;
}

const defaultLinker = (specifier: string) => {
  throw new Error(`Unable to resolve dependency: ${specifier}`);
};

export const importRemoteModule = async (
  moduleInstance: ScriptModel,
  context: {
    [x: string]: unknown;
    kernel?: IKernel;
    linker?: (
      specifier: string,
      referencingModule?: { context: Context },
    ) => Promise<void>;
  },
  refreshCopy = false,
): Promise<Module | void> => {
  const moduleHash =
    crypto.createHash('sha256').update(moduleInstance.code).digest('hex') +
    moduleInstance.name;

  if (refreshCopy || !modules[moduleHash]) {
    const compiled = new SourceTextModule(moduleInstance.code, {
      identifier: `Remote Module: "${moduleInstance.name}.js"`,
      context: createContext(Object.assign(context, globalContext)),
    });
    await compiled.link(context.linker || defaultLinker);
    modules[moduleHash] = compiled;
    context.kernel.globals.remoteModules.push(compiled);
    await modules[moduleHash].evaluate();
  } else {
    await modules[moduleHash].evaluate();
  }
  return modules[moduleHash];
};

const globalContext = {
  importRemoteModule,
  console,
};
