/**
 * General app description goes here
 *
 * @module main
 */
await import('#kernel/Kernel.js').then(async (kernel) => {
  await kernel
    .getKernel()
    .runImports()
    .then(async (kernel) => {
      await kernel.start();
    });
  /*TODO: make sure the router overrides the default methods used for navigation so the website works without js out of the box*/
  /*TODO: login page*/
  /*TODO: add and test guards*/
  /*TODO: table component*/
  /*TODO: form component and elements implementation*/
  /*TODO: api requests*/
  /*TODO: security + email app*/
  /*TODO: Add i18n module*/
});

console.log('start');
