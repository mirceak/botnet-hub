const PORT = 3000;
const { default: express } = await import('express');
const { default: bodyParser } = await import('body-parser');
const { default: cors } = await import('cors');
const { default: morgan } = await import('morgan');
const { default: compression } = await import('compression');
const { default: qs } = await import('qs');

const app = express();

app.use(express.json());
app.use(cors());
app.use(
  bodyParser.urlencoded({
    limit: '10mb',
    extended: true,
    parameterLimit: 10000,
  }),
);
app.use(morgan('dev'));
app.use(compression());
app.use(express.urlencoded({ extended: false }));
app.set('query parser', (str: string) => qs.parse(str));

app.get('/favicon.ico', (...[, res]) => {
  res.send('');
});
app.get('/@remoteModules/:path(.*)', async (...[req, res]) => {
  res.type('text/javascript');
  res.send(
    (await kernelGlobals.loadRemoteModule(req.url.replace('/', ''))).script
      .code,
  );
});
app.get('/node_modules/:path(.*)', async (...[req, res]) => {
  res.type('text/javascript');
  res.send(kernelGlobals.getFileContentsSync('.' + req.url));
});

app.get('/(.*)', async (...[req, res]) => {
  //if this is not a module/css/html file request it should return either ssr or the app component (for simple spa)
  if (req.query.SSR) {
    return await kernelGlobals.backendWorkers.jsdom.runJob({
      payload: { reqUrl: req.url },
      async callback(data: string) {
        res.send(data);
      },
    });
  }
  return res.send(`<!DOCTYPE html>
  <html xmlns="http://www.w3.org/1999/html">
  <body>
  <main-component/>
  <script type="module" src="/@remoteModules/frontend/engine/components/Main.js"></script>
  </body>
  </html>`);
});

await new Promise((resolve) => {
  app.listen(PORT, () => {
    console.log('Server listening on PORT', PORT);

    resolve(null);
  });
});
