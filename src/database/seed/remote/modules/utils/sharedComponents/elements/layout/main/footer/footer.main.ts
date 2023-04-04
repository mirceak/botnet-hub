import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponents({});

  const scopedCss = mainScope.asyncStaticFile(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.scss'
      )
  );

  class Element extends mainScope.HTMLElement {
    initElement = this.useInitElement(mainScope, async () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          o('<h1>', {
            innerText: 'Footer'
          }),
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    });
  }

  const instance = new mainScope.HTMLComponent(
    tagName || 'footer-main-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
