import type { type IKernelGlobals } from '@kernel/Kernel.js';

declare global {
  const kernelGlobals: IKernelGlobals,
    dynamicImportWatchers: Set<{ code: string; path: string }[]>;
}
