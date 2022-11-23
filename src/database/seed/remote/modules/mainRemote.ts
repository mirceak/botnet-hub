const PORT = 3000;

await new Promise((resolve) => {
  kernel.globals.express.listen(PORT, () => {
    console.log('Server listening on PORT', PORT);

    resolve(null);
  });
});
