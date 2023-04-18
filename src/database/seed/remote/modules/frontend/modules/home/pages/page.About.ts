import type {
  IMainScope,
  IWCElement
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject({
    ['button-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/form/element.form.button.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/frontend/modules/home/pages/page.About.scss')
  );

  class Element extends mainScope.BaseHtmlElement implements IWCElement {
    initElement = this.useInitElement(mainScope, () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          o('<div>', { className: 'card m-t-64 fit-content' }, [
            o('<h1>', { innerText: 'About Page' }),
            o('<div>', { className: 'row full-width justify-center' }, [
              o('<button-component>', () => ({
                elementAttributes: () => ({
                  className: 'bg-primary p-x-16',
                  innerText: 'Home',
                  handlers: {
                    click: [
                      {
                        callback: (e) => {
                          e.preventDefault();
                          void mainScope.router.push({
                            path: 'home'
                          });
                        }
                      }
                    ]
                  }
                })
              }))
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
    tagName || 'about-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
