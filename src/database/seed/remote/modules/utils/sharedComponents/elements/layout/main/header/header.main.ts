import type {
  IHTMLElementComponent,
  TMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: TMainScope) => {
  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    constructor() {
      super();
    }

    async init() {
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

export default (mainScope: TMainScope) => getComponent(mainScope);
