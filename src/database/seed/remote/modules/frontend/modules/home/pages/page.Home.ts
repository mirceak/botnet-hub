import type {
  IWCElement,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject({
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

  class Element extends mainScope.BaseHtmlElement implements IWCElement {
    initElement = this.useInitElement(mainScope, () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
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
                            if (mainScope.store.data)
                              mainScope.store.data.home.nameInput = (
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
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    });
  }

  const instance = new mainScope.BaseWebComponent(
    tagName || 'home-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
