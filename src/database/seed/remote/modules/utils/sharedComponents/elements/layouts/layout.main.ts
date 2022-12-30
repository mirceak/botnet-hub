import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';
import { IHTMLComponent } from '@remoteModules/frontend/engine/components/Main.js';

const getComponents = (mainScope: IHTMLElementsScope) => {
  return {
    DynamicHtmlView: mainScope.asyncRegisterComponent(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
        ),
    ),
    RouterView: mainScope.asyncRegisterComponent(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
        ),
    ),
  };
};

const getClass = (
  mainScope: IHTMLElementsScope,
  instance: ReturnType<typeof getSingleton>,
) => {
  const { DynamicHtmlView, RouterView } = instance.registerComponents();

  return class Component extends window.HTMLElement {
    constructor() {
      super();
    }

    init() {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          DynamicHtmlView.then(({ useComponent }) =>
            useComponent?.({
              contentGetter() {
                return `
                    <h1>${mainScope.store.data.home.titleWithName}</h1>
                  `;
              },
            }),
          ),
          RouterView.then(({ useComponent }) => useComponent()),
        ],
      });
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent implements IHTMLComponent {
    componentName = 'layout-main-component';

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope, this));
      } else if (window.SSR) {
        this.registerComponents();
      }
    };

    registerComponents = () => {
      return getComponents(mainScope);
    };

    useComponent = () => {
      return this.getComponentScope(this.componentName);
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
