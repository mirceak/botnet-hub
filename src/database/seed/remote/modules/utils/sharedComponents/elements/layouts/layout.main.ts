import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

export const staticScope = {
  registered: false,
  componentName: 'layout-main-component',
};

export const useComponent = () => {
  return {
    componentName: staticScope.componentName,
  };
};

const initComponent = (mainScope: IHTMLElementsScope) => {
  const [DynamicHtmlView, RouterView] = [
    mainScope.asyncRegisterComponent(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
        ),
    ),
    mainScope.asyncRegisterComponent(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
        ),
    ),
  ];

  return class NotFoundComponent extends window.HTMLElement {
    constructor() {
      super();
    }

    async init() {
      await mainScope.asyncHydrationCallback(async () => {
        await mainScope.asyncLoadComponentTemplate({
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
            RouterView.then(({ useComponent }) => useComponent?.()),
          ],
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
