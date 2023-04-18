import type {
  IMainScope,
  IWCExtendingBaseElementScope,
  IWCElement
} from '/remoteModules/frontend/engine/components/Main.js';

type ILocalInputScope = IWCExtendingBaseElementScope<HTMLInputElement>;

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject();

  class Element extends mainScope.BaseHtmlElement implements IWCElement {
    initElement = this.useInitElement(mainScope, (scope?: ILocalInputScope) => {
      const inputTemplate = o('<input>', scope?.elementAttributes);

      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [inputTemplate]
      });
    });
  }

  return new mainScope.BaseWebComponent<ILocalInputScope>(
    tagName || 'input-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
