import type {
  IMainScope,
  IComponentExtendingElementScope,
  IHTMLElementComponent
} from '/remoteModules/frontend/engine/components/Main.js';

type ILocalScope = IComponentExtendingElementScope<HTMLInputElement>;

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject();

  class Element
    extends mainScope.BaseHtmlElement
    implements IHTMLElementComponent
  {
    initElement = this.useInitElement(mainScope, (scope: ILocalScope) => {
      const selectTemplate = o('<input>', scope?.elementAttributes);

      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [selectTemplate]
      });
    });
  }

  return new mainScope.BaseComponent<ILocalScope>(
    tagName || 'select-input-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
