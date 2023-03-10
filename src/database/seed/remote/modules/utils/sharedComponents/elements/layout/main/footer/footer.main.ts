import type {
  IHTMLElementComponent,
  IHTMLElementsScope
} from '@remoteModules/frontend/engine/components/Main.js';

const getClass = (
  mainScope: IHTMLElementsScope,
  instance: ReturnType<typeof getSingleton>
) => {
  return class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    constructor() {
      super();
    }

    init() {
      void mainScope.asyncHydrationCallback(async () => {
        const scopedCss = await instance.useScopedCss();

        this.innerHTML = `<h1>Footer</h1>` + scopedCss;
      });
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'footer-main-component';

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope, this));
      }
    };

    useComponent = () => {
      return this.getComponentScope(this.componentName);
    };

    useScopedCss = async () => {
      const scopedCss = await mainScope.loadFile(
        () =>
          import(
            '@remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.scss'
          )
      );
      return this.getScopedCss(scopedCss.toString());
    };
  }

  return new Instance();
};

let componentInstance: ReturnType<typeof getSingleton>;

export default (mainScope: IHTMLElementsScope) => {
  if (!componentInstance || window.SSR) {
    if (!componentInstance) {
      componentInstance = getSingleton(mainScope);
    }
    componentInstance.initComponent(mainScope);
  }
  return componentInstance;
};
