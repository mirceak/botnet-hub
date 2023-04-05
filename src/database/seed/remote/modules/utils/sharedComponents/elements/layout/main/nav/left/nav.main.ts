import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject();

  const scopedCss = mainScope.asyncStaticFile(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.scss'
      )
  );

  class Element extends mainScope.HTMLElement {
    initElement = this.useInitElement(mainScope, () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          o('<h1>', {
            innerText: () => mainScope.store.data.home.titleWithName
          }),
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    });
  }

  const instance = new mainScope.HTMLComponent(
    tagName || 'nav-left-main-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
