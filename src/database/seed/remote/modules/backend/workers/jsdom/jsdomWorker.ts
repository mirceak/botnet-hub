import {
  IKernelBackendWorker,
  type IKernelBackendWorkerLoad
} from '#kernel/Kernel.js';

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
  //
}
