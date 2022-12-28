import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  contentGetter: () => string | undefined;
  noWatcher?: boolean;
  instant?: boolean;
}

export const staticScope = {
  registered: false,
  componentName: 'dynamic-html-view-component',
};

export const useComponent = (scope: ILocalScope) => {
  return {
    componentName: staticScope.componentName,
    scope,
  };
};

const initComponent = (mainScope: IHTMLElementsScope) => {
  return class DynamicHtmlViewComponent extends window.HTMLElement {
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

      if (!scope?.noWatcher) {
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

      if (scope?.instant && !mainScope.hydrating) {
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
export const registerComponent = async (mainScope: IHTMLElementsScope) => {
  if (staticScope.registered) {
    if (!mainScope.SSR) {
      return;
    } else {
      initComponent(mainScope);
    }
  }

  if (!staticScope.registered) {
    window.customElements.define(
      staticScope.componentName,
      initComponent(mainScope),
    );
  }

  staticScope.registered = true;
};
