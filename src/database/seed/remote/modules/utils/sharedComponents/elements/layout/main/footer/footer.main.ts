import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const scopedCss = await mainScope.asyncStaticFile(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.scss'
      )
  );

  class Element extends mainScope.HTMLElement {
    initElement = this.useInitElement(mainScope, () => {
      this.innerHTML =
        `<h1>Footer</h1>` + instance.getScopedCss(scopedCss.toString());
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
