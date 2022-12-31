import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  contentGetter: () => string | undefined;
  noWatcher?: boolean;
  instant?: boolean;
}

const getClass = (mainScope: IHTMLElementsScope) => {
  return class Component extends window.HTMLElement {
    private computeRender?: {
      props: CallableFunction[];
      computed: CallableFunction;
    };

    constructor() {
      super();
    }

    init(scope: ILocalScope) {
      const renderWatch = (value?: string) => {
        this.innerHTML = `${value}`;
      };

      if (!scope.noWatcher) {
        this.computeRender = {
          props: [() => scope.contentGetter()],
          computed: () => {
            renderWatch(scope.contentGetter());
          },
        };
        mainScope.store.registerOnChangeCallback(
          this.computeRender.props,
          this.computeRender.computed,
        );

        if (!mainScope.hydrating) {
          this.computeRender.computed();
        }
      }

      if (scope.instant && !mainScope.hydrating) {
        renderWatch(scope.contentGetter());
      }
    }

    disconnectedCallback() {
      if (this.computeRender) {
        mainScope.store.unRegisterOnChangeCallback(
          this.computeRender.props,
          this.computeRender.computed,
        );
      }
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'dynamic-html-view-component';

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope));
      }
    };

    useComponent = (scope: ILocalScope) => {
      return this.getComponentScope(this.componentName, scope);
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
