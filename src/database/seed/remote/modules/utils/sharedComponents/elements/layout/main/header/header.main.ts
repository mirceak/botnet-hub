import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const scopedCss = await mainScope.asyncStaticFile(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/header/header.main.scss'
      )
  );

  class Element extends mainScope.HTMLElement {
    constructor() {
      super();
    }

    async initElement() {
      this.innerHTML =
        `<h1>FullStack.js</h1>` + instance.getScopedCss(scopedCss.toString());
    }
  }

  const instance = new mainScope.HTMLComponent(
    tagName || 'header-main-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
