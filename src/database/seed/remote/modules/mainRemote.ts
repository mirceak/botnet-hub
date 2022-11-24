//load the front-end
await kernelGlobals.loadAndImportRemoteModule('frontendServer', {
  Object: {
    ...Object,

    //avoids prototype injections from untrusted code
    prototype: {
      get() {
        throw new Error('Object prototyping disabled for security reasons');
      },
      set() {
        throw new Error('Object prototyping disabled for security reasons');
      },
    },
    getPrototypeOf() {
      throw new Error('Object prototyping disabled for security reasons');
    },
  },
});
