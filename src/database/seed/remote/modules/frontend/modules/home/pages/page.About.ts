import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: b } = mainScope.useComponents({
    ['button-component']: () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/frontend/modules/home/pages/page.About.scss')
  );

  class Element extends mainScope.HTMLElement {
    initElement = this.useInitElement(mainScope, async () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          b('<div>', { className: 'card m-t-64 fit-content' }, [
            b('<h1>', { innerText: 'About Page' }),
            b('<div>', { className: 'row full-width justify-center' }, [
              b('<button-component>', {
                elementAttributes: {
                  className: 'bg-primary p-x-16',
                  innerText: 'Home'
                },
                onClick() {
                  mainScope.router.push('home');
                }
              })
            ])
          ]),
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    });
  }

  const instance = new mainScope.HTMLComponent(
    tagName || 'about-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
