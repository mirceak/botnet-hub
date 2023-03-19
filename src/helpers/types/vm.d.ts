import { linker, Module } from '#helpers/imports/importRemoteModule.js';
import { type Context } from 'node:vm';

declare module 'vm' {
  class SourceTextModule implements Module {
    constructor(
      code: string,
      options: {
        context: Context;
        identifier: string;
        importModuleDynamically(specifier: string): Promise<Module>;
      }
    );

    evaluate(): Promise<void>;

    link(linker: linker): Promise<void>;
  }
}
