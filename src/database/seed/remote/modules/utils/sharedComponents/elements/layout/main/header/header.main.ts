import type {
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope) => {
  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    constructor() {
      super();
    }

    async initElement() {
      await mainScope.asyncHydrationCallback(async () => {
        const scopedCss = await (
          await fetch(
            '/remoteModules/utils/sharedComponents/elements/layout/main/header/header.main.scss'
          )
        ).text();
        this.innerHTML =
          `<h1>FullStack.js</h1>` + instance.getScopedCss(scopedCss.toString());
      });
    }
  }

  const instance = new mainScope.HTMLComponent(
    'header-main-component',
    Component
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
