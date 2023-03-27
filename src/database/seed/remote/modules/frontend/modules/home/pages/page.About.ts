import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const {
    _Button: { getScope }
  } = {
    _Button: await mainScope.asyncComponent(() =>
      mainScope.asyncStaticModule(
        () =>
          import(
            '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
          )
      )
    )
  };

  const o = mainScope.useComponents({
    ['button-component']: getScope
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/frontend/modules/home/pages/page.About.scss')
  );

  class Element extends mainScope.HTMLElement {
    constructor() {
      super();
    }

    a = o['<div>'];

    async initElement() {
      await mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          o['<div>'](
            () => ({ className: 'card gap-8 m-a-16 fit-content' }),
            [
              o['<h1>']({ innerText: 'About Page' }),
              o['<div>'](
                async () => ({
                  className: 'row full-width justify-center'
                }),
                [
                  o['<button-component>']({
                    onClick() {
                      mainScope.router.push('home');
                    },
                    elementAttributes: { class: 'bg-primary' },
                    label: 'Home'
                  }),
                  o['<button-component>'](() => ({
                    onClick() {
                      mainScope.router.push('home');
                    },
                    elementAttributes: { class: 'bg-primary' },
                    label: 'Home'
                  })),
                  o['<button-component>'](async () => ({
                    onClick() {
                      mainScope.router.push('home');
                    },
                    elementAttributes: { class: 'bg-primary' },
                    label: 'Home'
                  }))
                ]
              )
            ]
          ),
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    }
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
