import {
  IKernelBackendWorker,
  type IKernelBackendWorkerLoad
} from '@kernel/Kernel.js';

interface JsdomWorkerLoad extends IKernelBackendWorkerLoad {
  id?: string;
  callback?: (data: string) => void;
}

const { default: cluster } = await import('cluster');
if (cluster.isPrimary) {
  const childProc = cluster.fork();
  const jsDocWorkers = [] as JsdomWorkerLoad[];

  childProc.on('message', (html: Record<string, string>) => {
    const index = jsDocWorkers.findIndex((jsDocWorker) => {
      return jsDocWorker.id === html.id;
    });

    jsDocWorkers[index].callback?.(html.data);
    delete jsDocWorkers[index].id;
    delete jsDocWorkers[index].callback;
    jsDocWorkers.splice(index, 1);
  });

  kernelGlobals.backendWorkers.jsdom = {
    runJob(workerLoad: JsdomWorkerLoad) {
      const id = Date.now().toString();
      jsDocWorkers.push({
        callback: workerLoad.callback,
        payload: workerLoad.payload,
        id
      });
      childProc.send({ payload: workerLoad.payload, id });
    }
  } as IKernelBackendWorker;
} else {
  const { JSDOM } = await import('jsdom');

  const htm = /* HTML */ `
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/html" lang="en">
      <head>
        <link rel="icon" href="data:," />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>FullStack.js</title>
      </head>
      <body />
    </html>
  `;
  let processId: string;
  const dom = new JSDOM(htm, { runScripts: 'outside-only' });
  dom.window.SSR = true;

  const dynamicImportWatcher = [] as { code: string; path: string }[];
  const { registerMainComponent } =
    (await kernelGlobals.loadAndImportRemoteModule(
      '@remoteModules/frontend/engine/components/Main.js',
      {
        window: dom.window
      }
    )) as typeof import('@remoteModules/frontend/engine/components/Main.js');
  registerMainComponent();

  const mainModuleScript = await kernelGlobals.loadRemoteModule(
    '@remoteModules/frontend/engine/components/Main.js'
  );

  dom.window.onHTMLReady = () => {
    let htmlBody = dom.serialize();
    dynamicImportWatchers.delete(dynamicImportWatcher);
    htmlBody = htmlBody.replace(
      '</body>',
      /* HTML */ `<script type='module'>${
        mainModuleScript.script?.code
          .replace(
            '__modulesLoadedWithSSR = [];',
            `__modulesLoadedWithSSR = ${JSON.stringify(dynamicImportWatcher)};`
          )
          .replace('hydrating = window._shouldHydrate;', `hydrating = true;`)
          .replace('SSR = window.SSR;', `SSR = false;`) || ''
      }</script></body>`
    );
    dynamicImportWatcher.splice(0);
    process.send?.({
      id: processId,
      data: htmlBody
    });
  };

  const onMessage = ({
    payload,
    id
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
