import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

export const staticScope = {
  registered: false,
  componentName: 'proxy-router-view-component',
};

export const useComponent = () => {
  return {
    componentName: staticScope.componentName,
  };
};

export const initComponent = (mainScope: IHTMLElementsScope) => {
  const [RouterView] = [
    mainScope.asyncRegisterComponent(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
        ),
    ),
  ];

  return class ProxyRouterViewComponent extends window.HTMLElement {
    constructor() {
      super();
    }

    async init() {
      await mainScope.asyncHydrationCallback(async () => {
        await mainScope.asyncLoadComponentTemplate({
          target: this,
          components: [RouterView.then(({ useComponent }) => useComponent?.())],
        });
      });
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
