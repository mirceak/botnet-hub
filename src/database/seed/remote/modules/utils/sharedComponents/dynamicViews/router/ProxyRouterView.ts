import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

const getComponents = (mainScope: IHTMLElementsScope) => {
  return {
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
  const { RouterView } = instance.registerComponents();

  return class Component extends window.HTMLElement {
    constructor() {
      super();
    }

    init() {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [RouterView.then(({ useComponent }) => useComponent?.())],
      });
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'proxy-router-view-component';

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope, this));
      } else if (mainScope.SSR) {
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
