import type {
  IWCExtendingBaseElementScope,
  IWCElement,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

type ILocalButtonScope = IWCExtendingBaseElementScope<HTMLButtonElement>;

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject();

  class Element extends mainScope.BaseHtmlElement implements IWCElement {
    initElement = this.useInitElement(
      /* TODO: add wc-if directives */
      mainScope,
      (scope?: ILocalButtonScope) => {
        const buttonTemplate = o('<button>', scope?.elementAttributes);
        mainScope.asyncLoadComponentTemplate({
          target: this,
          components: [buttonTemplate]
        });
      }
    );
  }

  return new mainScope.BaseWebComponent<ILocalButtonScope>(
    tagName || 'button-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
