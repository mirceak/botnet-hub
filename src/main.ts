/**
 * General app description goes here
 *
 * @module main
 */
await import('@kernel/Kernel.js').then(async (kernel) => {
  await kernel
    .getKernel()
    .runImports()
    .then(async (kernel) => {
      await kernel.start();
    });
});

console.log('start');
