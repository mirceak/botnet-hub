const PORT = 3000;

const { createSSRApp, ref } = await import('vue');
const { renderToString } = await import('vue/server-renderer');

kernelGlobals.express.get('/', async (...[, res]) => {
  const app = createSSRApp({
    setup: () => {
      const count = ref(3);

      return { count };
    },
    template: `<button @click="count++">{{ count }}</button>`,
  });
  renderToString(app).then((html) => {
    res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Vue SSR Example</title>
      </head>
      <body>
        <div id="app">${html}</div>
        
        <script type="module">
        import { createSSRApp, ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

        const app = createSSRApp({
          setup: () => {
            const count = ref(3)  
              
            return { count };
          },
          template: \`<button @click="count++">{{ count }}</button>\`,
        })
        
        // mounting an SSR app on the client assumes
        // the HTML was pre-rendered and will perform
        // hydration instead of mounting new DOM nodes.
        app.mount('#app')
        </script>
      </body>
    </html>
    `);
  });
});

await new Promise((resolve) => {
  kernelGlobals.express.listen(PORT, () => {
    console.log('Server listening on PORT', PORT);

    resolve(null);
  });
});
