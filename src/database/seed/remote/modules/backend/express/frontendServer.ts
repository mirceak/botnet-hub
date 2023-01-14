const PORT = 3000;
const { default: qs } = await import('qs');
const { default: cors } = await import('cors');
const { default: compression } = await import('compression');
const { default: express } = await import('express');
const { default: morgan } = await import('morgan');

const app = express();

app.set('query parser', (str: string) => qs.parse(str));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('short'));

app.get('/favicon.ico', (...[, res]) => {
  return (
    res
      // .set('Cache-control', 'public, max-age=2592000')
      .send()
  );
});
app.get('/@remoteModules/:path(.*)', (...[req, res]) => {
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

app.get('/@remoteFiles/:path(.*)', (...[req, res]) => {
  res.type('text/css');
  void kernelGlobals
    .loadRemoteModule(req.url.replace('/@remoteFiles/', '@remoteFiles/'))
    .then((module) => {
      const remoteFiles = module.script?.code as string;
      res
        // .set('Cache-control', 'public, max-age=2592000')
        .send(remoteFiles);
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

  /*language=HTML*/
  return res.send(`
		<!DOCTYPE html>
		<html
			xmlns='http://www.w3.org/1999/html'
		>
			<head>
				<link rel='icon' href='data:,'>
				<meta
					name='viewport'
					content='width=device-width, initial-scale=1'
				>
			</head>
			<body>
				<main-component />
				<script type='module' src='/@remoteModules/frontend/engine/components/Main.js'></script>
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
