import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponents({
    ['router-view-component']: await mainScope.asyncComponentScopeGetter(
      () =>
        import(
          '/remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
        )
    )
  });

  class Element extends mainScope.HTMLElement {
    initElement = this.useInitElement(mainScope, () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [o('<router-view-component>')]
      });
    });
  }

  return new mainScope.HTMLComponent(
    tagName || 'proxy-router-view-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
