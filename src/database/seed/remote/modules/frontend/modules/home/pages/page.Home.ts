import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope) => {
  const { o } = mainScope.useComponentsObject({
    ['button-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/form/element.form.button.js'
      ),
    ['input-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/form/inputs/element.form.input.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/frontend/modules/home/pages/page.Home.scss')
  );

  return mainScope.useComponentRegister('home-component', async (options) => {
    options.useInitElement(() => {
      options.asyncLoadComponentTemplate({
        components: [
          o('<div>', { className: 'card m-t-64 fit-content' }, [
            o('<h1>', { innerText: 'Home Page' }),
            o('<div>', { className: 'row full-width justify-center' }, [
              o('<div>', { className: 'content' }, [
                o('<input-component>', {
                  elementAttributes: {
                    handlers: {
                      input: [
                        {
                          callback: (e) => {
                            e.preventDefault();
                            mainScope.store.state.home.nameInput = (
                              e.target as HTMLInputElement
                            ).value;
                          }
                        }
                      ]
                    },
                    placeholder: 'Enter some text...'
                  }
                }),
                o('<button-component>', {
                  elementAttributes: {
                    handlers: {
                      click: [
                        {
                          callback: (e) => {
                            e.preventDefault();
                            void mainScope.router.push({
                              name: 'about'
                            });
                          }
                        }
                      ]
                    },
                    innerText: 'About'
                  }
                }),
                o('<button-component>', {
                  elementAttributes: {
                    innerText: 'Dev Components',
                    className: 'bg-primary',
                    handlers: {
                      click: [
                        {
                          callback: (e) => {
                            e.preventDefault();
                            void mainScope.router.push({
                              name: 'components'
                            });
                          }
                        }
                      ]
                    }
                  }
                })
              ])
            ])
          ]),
          async () => {
            return options.getScopedCss(await scopedCss);
          }
        ]
      });
    });
  });
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
