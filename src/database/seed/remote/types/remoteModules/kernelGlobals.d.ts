import type { type IKernelGlobals } from '@kernel/Kernel.js';

declare global {
  const kernelGlobals: IKernelGlobals;
  const dynamicImportWatchers: Map<Record<string, unknown>[]>;
}
