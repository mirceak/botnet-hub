const cluster = await import('cluster');

if (cluster.default.isPrimary) {
  await kernelGlobals.loadAndImportRemoteModule(
    '#remoteModules/backend/express/frontendServer.js'
  );
}

//TODO: implement the web worker logic that handles serving code
// const buildServiceWorkerBlob = (
//   moduleCodes: { url: string; code: string }[]
// ): Blob => {
//   const workerCode = `
//     const cacheName = 'prebuilt-modules';
//
//     self.addEventListener('install', (event) => {
//       event.waitUntil((async () => {
//         const cache = await caches.open(cacheName);
//         const moduleResponses = [
//           ${moduleCodes
//             .map(
//               (module) => `
//             {
//               url: '${module.url}',
//               code: \`${module.code}\`,
//             }
//           `
//             )
//             .join(',')}
//         ];
//
//         await Promise.all(moduleResponses.map(async (module) => {
//           const response = new Response(module.code, {
//             headers: { 'Content-Type': 'application/javascript' },
//           });
//           await cache.put(module.url, response);
//         }));
//       })());
//     });
//
//     self.addEventListener('fetch', (event) => {
//       if (event.request.destination === 'script' && event.request.mode === 'cors') {
//         event.respondWith((async () => {
//           const url = event.request.url;
//           const cache = await caches.open(cacheName);
//           const cachedResponse = await cache.match(url);
//           if (cachedResponse) {
//             return cachedResponse;
//           } else {
//             return fetch(event.request);
//           }
//         })());
//       }
//     });
//   `;
//
//   return new Blob([workerCode], { type: 'application/javascript' });
// };
//
// const loadServiceWorker = (blob: Blob): Promise<MessagePort> => {
//   return new Promise((resolve, reject) => {
//     const worker = new Worker(URL.createObjectURL(blob));
//     const channel = new MessageChannel();
//
//     worker.addEventListener('message', (event) => {
//       if (event.data === 'ready') {
//         resolve(channel.port1);
//       } else {
//         console.error(
//           'Unknown message received from service worker:',
//           event.data
//         );
//       }
//     });
//
//     worker.addEventListener('error', (error) => {
//       reject(error);
//     });
//
//     worker.postMessage(null, [channel.port2]);
//   });
// };
//
// const moduleCodes = [
//   {
//     url: 'https://example.com/module1.js',
//     code: 'export function add(a, b) { return a + b; }'
//   },
//   {
//     url: 'https://example.com/module2.js',
//     code: 'export function subtract(a, b) { return a - b; }'
//   }
// ];
//
// const serviceWorkerBlob = buildServiceWorkerBlob(moduleCodes);
//
// loadServiceWorker(serviceWorkerBlob)
//   .then((port) => {
//     console.log('Service worker loaded');
//
//     // Use the message port to communicate with the service worker
//     port.addEventListener('message', (event) => {
//       console.log('Message received from service worker:', event.data);
//     });
//
//     port.start();
//   })
//   .catch((error) => {
//     console.error('Error loading service worker:', error);
//   });
