(async () => {
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

    /*TODO: add separate tsconfig files for each env -> entities / frontend / rest*/
    /*TODO: add and test guards*/
    /*TODO: table component*/
    /*TODO: form component and elements implementation*/
    /*TODO: api requests*/
    /*TODO: security + email app*/
    /*TODO: Add i18n module*/
  });
  console.log('start');
})();
