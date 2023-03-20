import type {
  IHTMLElementComponent,
  TMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: TMainScope) => {
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
            '/remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.scss'
          )
        ).text();
        this.innerHTML =
          `<h1>Footer</h1>` + instance.getScopedCss(scopedCss.toString());
      });
    }
  }

  const instance = new mainScope.HTMLComponent(
    'footer-main-component',
    Component
  );
  return instance;
};

export default async (mainScope: TMainScope) => getComponent(mainScope);
