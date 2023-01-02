import { type IKernelBackendWorkerLoad } from '@kernel/Kernel.js';

interface JsdomWorkerLoad extends IKernelBackendWorkerLoad {
  id?: string;
  callback?: (data: string) => Promise<void>;
}

const { default: cluster } = await import('cluster');
if (cluster.isPrimary) {
  const childProc = cluster.fork();
  const jsDocWorkers = [] as JsdomWorkerLoad[];

  childProc.on('message', async (html) => {
    const index = jsDocWorkers.findIndex((jsDocWorker) => {
      return jsDocWorker.id === html.id;
    });
    await jsDocWorkers[index].callback?.(html.data);
    delete jsDocWorkers[index].id;
    delete jsDocWorkers[index].callback;
    jsDocWorkers.splice(index, 1);
  });

  kernelGlobals.backendWorkers.jsdom = {
    async runJob(workerLoad: JsdomWorkerLoad) {
      const id = Date.now().toString();
      jsDocWorkers.push({
        callback: workerLoad.callback,
        payload: workerLoad.payload,
        id,
      });
      childProc.send({ payload: workerLoad.payload, id });
    },
  };
} else {
  const { JSDOM } = await import('jsdom');
  const htm = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/html">
<head>
<link rel="icon" href="data:,">
</head>
<body/>
</html>`;
  let processId: string;
  const dom = new JSDOM(htm, { runScripts: 'outside-only' });
  dom.window.SSR = true;

  const dynamicImportWatcher = [] as Record<string, unknown>[];

  const { registerMainComponent } =
    (await kernelGlobals.loadAndImportRemoteModule(
      '@remoteModules/frontend/engine/components/Main.js',
      {
        window: dom.window,
      },
    )) as typeof import('@remoteModules/frontend/engine/components/Main.js');
  await registerMainComponent();

  const mainModuleScript = await kernelGlobals.loadRemoteModule(
    '@remoteModules/frontend/engine/components/Main.js',
  );

  dom.window.onHTMLReady = () => {
    let htmlBody = dom.serialize();
    dynamicImportWatchers.delete(dynamicImportWatcher);
    htmlBody = htmlBody.replace(
      '</body>',
      `<script type="module">
${mainModuleScript.script?.code
  .replace(
    '__modulesLoadedWithSSR = [];',
    `__modulesLoadedWithSSR = ${JSON.stringify(dynamicImportWatcher)};`,
  )
  .replace('hydrating = window._shouldHydrate;', `hydrating = true;`)
  .replace('SSR = window.SSR;', `SSR = false;`)}
</script></body>`,
    );
    dynamicImportWatcher.splice(0);
    process.send?.({
      id: processId,
      data: htmlBody,
    });
  };

  const onMessage = async ({
    payload,
    id,
  }: {
    payload: Record<string, string>;
    id: string;
  }) => {
    if (!dynamicImportWatchers.has(dynamicImportWatcher)) {
      dynamicImportWatchers.add(dynamicImportWatcher);
    }
    dom.window.pathname = payload.reqUrl.split('?')[0];
    processId = id;
    dom.window.document.body.innerHTML = '<main-component>';
  };

  process.on('message', onMessage);
}
