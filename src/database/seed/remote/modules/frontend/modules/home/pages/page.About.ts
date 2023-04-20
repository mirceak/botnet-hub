import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope) => {
  const { o } = mainScope.useComponentsObject({
    ['button-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/form/element.form.button.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/frontend/modules/home/pages/page.About.scss')
  );

  return mainScope.useComponentRegister('about-component', (options) => {
    options.useInitElement(() => {
      options.asyncLoadComponentTemplate({
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
