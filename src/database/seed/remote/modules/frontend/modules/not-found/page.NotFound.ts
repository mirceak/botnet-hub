import type {
  IWCElement,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  class Element extends mainScope.BaseHtmlElement implements IWCElement {
    initElement = this.useInitElement(mainScope, () => {
      const { builder: o } = mainScope.useComponentsObject();

      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          o('<h1>', {
            innerText: 'Page not found!'
          })
        ]
      });
    });
  }

  return new mainScope.BaseWebComponent(
    tagName || 'not-found-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
