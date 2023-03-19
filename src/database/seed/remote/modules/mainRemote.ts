const cluster = await import('cluster');

if (cluster.default.isPrimary) {
  await kernelGlobals.loadAndImportRemoteModule(
    '#remoteModules/backend/express/frontendServer.js'
  );
}
