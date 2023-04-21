import type { type IKernelGlobals } from '/src/kernel/Kernel.js';

declare global {
  const kernelGlobals: IKernelGlobals;
}
