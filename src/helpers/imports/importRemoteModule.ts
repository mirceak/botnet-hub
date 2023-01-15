import { type Script as ScriptModel } from '@database/entities/Script.js';
import { SourceTextModule, createContext } from 'node:vm';
import { type IKernelGlobals } from '@src/kernel/Kernel.js';
import { getFileContentsSync } from '@helpers/imports/io.js';

const watcherPathOverrides = {
  '../../../../node_modules/path-to-regexp/dist/index.js':
    '../../../../node_modules/path-to-regexp/dist.es2015/index.js'
};

export type linker = (specifier: string) => Promise<void>;

export const dynamicImportWatchers = new Set<
  { code: string; path: string }[]
>();

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
  returnModule?: true
): Promise<Record<string, unknown> | SourceTextModule> => {
  if (
    context.kernelGlobals &&
    !context.kernelGlobals.remoteModules[moduleInstance.name]
  ) {
    context.exports = {} as Exports;
    context.dynamicImportWatchers = dynamicImportWatchers;
    context.fetch = async (specifier: string) => {
      /*file imports for backend*/
      const code = (await context.kernelGlobals?.loadRemoteModule(specifier))
        ?.script?.code;
      if (code) {
        for (const watcher of dynamicImportWatchers) {
          watcher.push({
            code,
            path: specifier
          });
        }
      }
      return code;
    };
    const compiled = new SourceTextModule(moduleInstance.code, {
      identifier: `Remote Module: "${moduleInstance.name}"`,
      context: createContext(Object.assign(context, globalContext)),
      async importModuleDynamically(specifier) {
        if (
          specifier.indexOf('./') !== -1 &&
          specifier.indexOf('@node_modules/') === -1
        ) {
          if (specifier.includes('./node_modules/')) {
            // backend node_modules imports for SSR
            for (const watcher of dynamicImportWatchers) {
              watcher.push({
                code: getFileContentsSync(
                  `node_modules/${
                    (
                      watcherPathOverrides[
                        specifier as keyof typeof watcherPathOverrides
                      ] ?? specifier
                    )
                      .split('./node_modules/')
                      .pop() || ''
                  }`
                ).replaceAll(/^\/\/# sourceMappingURL=.*$/gm, ''),
                path:
                  watcherPathOverrides[
                    specifier as keyof typeof watcherPathOverrides
                  ] ?? specifier
              });
            }
            return import(specifier.split('./node_modules/').pop() as string);
          }

          const importContext = context.exports?.nextImportContext ?? context;
          delete context.exports?.nextImportContext;
          for (const watcher of dynamicImportWatchers) {
            watcher.push({
              code:
                (
                  await context.kernelGlobals?.loadRemoteModule(
                    `@remoteModules/${specifier.split('./').pop() || ''}`
                  )
                )?.script?.code || '',
              path: specifier
            });
          }
          return context.kernelGlobals?.loadAndImportRemoteModule(
            `@remoteModules/${specifier.split('./').pop() || ''}`,
            importContext,
            true
          );
        }
        // naked imports for backend
        return import(
          specifier
            .replace(
              '@remoteFiles/',
              '../../../src/database/seed/remote/modules/utils/assets/'
            )
            .replace('@node_modules/', '')
        );
      }
    });
    await compiled.link(defaultLinker);
    await compiled.evaluate();
    if (context.kernelGlobals) {
      context.kernelGlobals.remoteModules[moduleInstance.name] = returnModule
        ? compiled
        : ({
            exports: context.exports
          } as Module);
    }
    return returnModule ? compiled : context.exports;
  } else {
    if (context.kernelGlobals) {
      return returnModule
        ? context.kernelGlobals.remoteModules[moduleInstance.name]
        : (context.kernelGlobals.remoteModules[moduleInstance.name]
            .exports as Exports);
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
