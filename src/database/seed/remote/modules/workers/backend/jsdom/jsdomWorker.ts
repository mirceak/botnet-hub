import { type IKernelBackendWorkerLoad } from '@kernel/Kernel.js';
import type * as MainComponent from '@remoteModules/frontend/engine/components/Main.js';

interface JsdomWorkerLoad extends IKernelBackendWorkerLoad {
  id: string;
  callback: (data: string) => Promise<void>;
}

const { default: cluster } = await import('cluster');
if (cluster.isPrimary) {
  const childProc = cluster.fork();
  const jsDocWorkers = [] as JsdomWorkerLoad[];

  childProc.on('message', async (html) => {
    const index = jsDocWorkers.findIndex((jsDocWorker) => {
      return jsDocWorker.id === html.id;
    });
    await jsDocWorkers[index].callback(html.data);
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
<body/>
</html>`;
  const dom = new JSDOM(htm, { runScripts: 'outside-only' });
  dom.window.SSR = true;
  const mainComponent = (await kernelGlobals.loadAndImportRemoteModule(
    '@remoteModules/frontend/engine/components/Main.js',
    {
      window: dom.window,
    },
  )) as typeof MainComponent;
  await mainComponent.registerMainComponent();

  const onMessage = async ({
    payload,
    id,
  }: {
    payload: Record<string, string>;
    id: string;
  }) => {
    dom.window.pathname = payload.reqUrl.split('?')[0];
    dom.window.onHTMLReady = () => {
      const htmlBody = dom
        .serialize()
        .replace(
          '</body>',
          '<script type="module" src="/@remoteModules/frontend/engine/components/Main.js"></script><script>window._shouldHydrate = true;</script>',
        );
      process.send({
        id: id,
        data: htmlBody,
      });
    };
    dom.window.document.body.innerHTML = '<main-component>';
  };

  process.on('message', onMessage);
}
