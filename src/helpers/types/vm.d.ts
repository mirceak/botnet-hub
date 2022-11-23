import { linker, Module } from '@helpers/imports/importRemoteModule.js';

declare module 'vm' {
  class SourceTextModule implements Module {
    constructor(
      code: string,
      options: { context: Context; identifier: string },
    );

    evaluate(): Promise<void>;

    link(linker: linker): Promise<void>;
  }
}
