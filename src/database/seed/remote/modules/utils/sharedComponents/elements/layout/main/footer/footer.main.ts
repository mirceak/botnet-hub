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
      const scopedCss = await mainScope.asyncStaticFile(
        () =>
          import(
            '/remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.scss'
          )
      );
      this.innerHTML =
        `<h1>Footer</h1>` + instance.getScopedCss(scopedCss.toString());
    }
  }

  const instance = new mainScope.HTMLComponent(
    'footer-main-component',
    Component
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
