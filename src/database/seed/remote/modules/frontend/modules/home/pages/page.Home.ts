import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: b } = mainScope.useComponents({
    ['button-component']: () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
      ),
    ['input-component']: () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/form/inputs/element.form.input.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/frontend/modules/home/pages/page.Home.scss')
  );

  class Element extends mainScope.HTMLElement {
    constructor() {
      super();
    }

    initElement = this.useInitElement(mainScope, async () => {
      await mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          b('<input-component>', {
            onInput(value: string) {
              mainScope.store.data.home.nameInput = value;
            },
            elementAttributes: {
              placeholder: 'Enter some text...'
            }
          }),
          b('<button-component>', {
            onClick() {
              mainScope.router.push({ name: 'about' });
            },
            elementAttributes: {
              innerText: 'About'
            }
          }),
          b('<button-component>', {
            onClick() {
              mainScope.router.push({ name: 'components' });
            },
            elementAttributes: {
              innerText: 'Dev Components',
              className: 'bg-primary'
            }
          }),
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    });
  }

  const instance = new mainScope.HTMLComponent(
    tagName || 'home-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
