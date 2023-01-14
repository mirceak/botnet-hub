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
  /*TODO: Add i18n module*/
  /*TODO: form component implementation*/
  /*TODO: security + email app*/
  /*TODO: response minification and obfuscation !? compression package might be sufficient*/
  /*TODO: api requests*/
});

console.log('start');
