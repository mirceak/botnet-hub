const cluster = await import('cluster');
await import('@remoteModules/backend/workers/jsdom/jsdomWorker.js');

if (cluster.default.isPrimary)
  await import('@remoteModules/backend/express/frontendServer.js');
