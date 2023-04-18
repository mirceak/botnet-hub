import type {
  IWCElement,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject({
    ['router-view-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/dynamicViews/router/RouterView.js'
      )
  });

  class Element extends mainScope.BaseHtmlElement implements IWCElement {
    initElement = this.useInitElement(mainScope, () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [o('<router-view-component>')]
      });
    });
  }

  return new mainScope.BaseWebComponent(
    tagName || 'proxy-router-view-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
