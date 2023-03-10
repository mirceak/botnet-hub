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

app.get('/favicon.ico', (...[, res]) => {
  return (
    res
      // .set('Cache-control', 'public, max-age=2592000')
      .send()
  );
});
app.get(['/@remoteModules/:path(.*)'], (...[req, res]) => {
  res.type('text/javascript');
  void kernelGlobals
    .loadRemoteModule(req.url.replace('/', ''))
    .then((module) => {
      const remoteModules = module.script?.code as string;
      res
        // .set('Cache-control', 'public, max-age=2592000')
        .send(remoteModules);
    });
});
app.get('/node_modules/:path(.*)', (...[req, res]) => {
  res.type('text/javascript');
  const node_modules = kernelGlobals
    .getFileContentsSync('.' + req.url)
    .replaceAll(/^\/\/# sourceMappingURL=.*$/gm, '');

  return (
    res
      // .set('Cache-control', 'public, max-age=2592000')
      .send(node_modules)
  );
});

app.get('/(.*)', (...[req, res]) => {
  if (req.query.SSR) {
    void kernelGlobals.backendWorkers.jsdom.runJob({
      payload: { reqUrl: req.url },
      callback: (data: string) => {
        res
          // .set('Cache-control', 'public, max-age=2592000')
          .send(data);
      }
    });

    return;
  }

  return res.send(/* HTML */ `
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/html" lang="en">
      <head>
        <link rel="icon" href="data:," />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>FullStack.js</title>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <main-component />
        <script
          type="module"
          src="/@remoteModules/frontend/engine/components/Main.js"
        ></script>
      </body>
    </html>
  `);
});

await new Promise((resolve) => {
  app.listen(PORT, () => {
    console.log('Server listening on PORT', PORT);

    resolve(null);
  });
});
