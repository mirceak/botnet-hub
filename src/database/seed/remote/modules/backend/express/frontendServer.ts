const PORT = 3000;
const { default: express } = await import('express');
const { default: cors } = await import('cors');
const { default: morgan } = await import('morgan');
const { default: compression } = await import('compression');
const { default: qs } = await import('qs');

const app = express();

app.use(compression());
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('tiny'));
app.set('query parser', (str: string) => qs.parse(str));

const routes = Object.freeze([
  {
    path: '/home',
    requests: [
      {
        path: '#remoteModules/utils/sharedComponents/elements/layout/main/layout.main.js',
        requests: [
          {
            path: '#remoteModules/utils/assets/scss/theme/main/theme.main.scss'
          },
          {
            path: '#remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
          },
          {
            path: '#remoteModules/utils/sharedComponents/elements/layout/main/header/header.main.js',
            requests: [
              {
                path: '#remoteModules/utils/sharedComponents/elements/layout/main/header/header.main.scss'
              }
            ]
          },
          {
            path: '#remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.js',
            requests: [
              {
                path: '#remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.scss'
              }
            ]
          },
          {
            path: '#remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.js',
            requests: [
              {
                path: '#remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.scss'
              }
            ]
          }
        ]
      }
    ],
    children: [
      {
        path: '',
        requests: [
          {
            path: '#remoteModules/utils/sharedComponents/dynamicViews/router/ProxyRouterView.js',
            requests: [
              {
                path: '#remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
              }
            ]
          }
        ],
        children: [
          {
            path: '',
            useRouter: true,
            useStore: true,
            requests: [
              {
                path: '#remoteModules/frontend/modules/home/pages/page.Home.js',
                requests: [
                  {
                    path: '#remoteModules/utils/sharedComponents/elements/form/inputs/element.form.input.js'
                  },
                  {
                    path: '#remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
                  },
                  {
                    path: '#remoteModules/frontend/modules/home/pages/page.Home.scss'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]);

app.get('/favicon.ico', (...[, res]) => {
  return (
    res
      // .set('Cache-control', 'public, max-age=2592000')
      .send()
  );
});
app.get(['/remoteModules/:path(.*)'], (...[req, res]) => {
  const fileExtension = req.url.split('.').pop();
  if (fileExtension === 'scss') {
    res.type('text/css');
  } else {
    res.type('text/javascript');
  }
  return void kernelGlobals
    .loadRemoteModule(req.url.replace('/', '#'))
    .then((module) => {
      const remoteModules = module.script?.code as string;
      res.set('Cache-control', 'public, max-age=2592000').send(remoteModules);
    });
});
app.get('/node_modules/:path(.*)', (...[req, res]) => {
  res.type('text/javascript');
  const node_modules = kernelGlobals
    .getFileContentsSync(req.url.replace('/', ''))
    .replaceAll(/^\/\/# sourceMappingURL=.*$/gm, '');

  return res.set('Cache-control', 'public, max-age=2592000').send(node_modules);
});

app.get('/(.*)', (...[req, res]) => {
  const route = routes.filter((_route) => _route.path === req.url)[0];
  const requestReducer = (result: { requests: string[] }, request: any) => {
    if (result.requests.indexOf(request.path) === -1) {
      result.requests.push(request.path);
    }
    request.requests?.reduce(requestReducer, result);
    return result;
  };
  const routeReducer = (result: { requests: string[] }, route: any) => {
    route.requests?.reduce(requestReducer, result);
    if (route.useRouter) {
      result.requests.push('#remoteModules/utils/helpers/shared/utils.js');
      result.requests.push('#remoteModules/frontend/engine/router.js');
      result.requests.push('/node_modules/path-to-regexp/dist.es2015/index.js');
    }
    if (route.useStore) {
      result.requests.push('#remoteModules/frontend/engine/store.js');
      result.requests.push('#remoteModules/utils/reactivity/objectProxy.js');
    }
    route.children?.reduce(routeReducer, result);
    return result;
  };
  const routeParser = (_route: any, result: { requests: string[] }) => {
    if (!_route) return { requests: [] };
    _route.requests?.reduce(requestReducer, result);
    if (_route.children) {
      _route.children.reduce(routeReducer, result);
    }
    return result;
  };
  const requestRecipe = routeParser(route, { requests: [] });
  const scriptData: Record<string, string>[] = [];
  let mainModule: string;
  requestRecipe.requests.push(
    '#remoteModules/frontend/engine/components/Main.js'
  );
  return void Promise.all(
    requestRecipe.requests.map(async (request) => {
      if (request.includes('#remoteModules')) {
        if (request === '#remoteModules/frontend/engine/components/Main.js') {
          return kernelGlobals.loadRemoteModule(request).then((module) => {
            mainModule = module.script?.code as string;
          });
        }
        return kernelGlobals.loadRemoteModule(request).then((module) => {
          scriptData.push({
            path: request,
            code: module.script?.code as string
          });
        });
      } else {
        scriptData.push({
          path: request,
          code: kernelGlobals
            .getFileContentsSync('./' + request)
            .replaceAll(/^\/\/# sourceMappingURL=.*$/gm, '')
        });
      }
    })
  ).then(() => {
    /* language=HTML */
    return res.send(`
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/html" lang="en">
      <head>
        <link rel="icon" href="data:,"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>FullStack.js</title>
      </head>
      <body>
      <main-component style="display: none"/>
      </body>
      <script
          defer
          type="module"
      >
        ${mainModule.replace(
          `preloadedRequests = [];`,
          `preloadedRequests = ${JSON.stringify(scriptData).replaceAll(
            /#remoteModules/g,
            '/remoteModules'
          )}`
        )}
      </script>
      </html>
    `);
  });
});

await new Promise((resolve) => {
  app.listen(PORT, () => {
    console.log('Server listening on PORT', PORT);

    resolve(null);
  });
});
