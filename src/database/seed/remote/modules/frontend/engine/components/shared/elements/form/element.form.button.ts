import type {
  IComponentExtendingElementScope,
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

type ILocalButtonScope = IComponentExtendingElementScope<HTMLButtonElement>;

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject();

  class Element
    extends mainScope.BaseHtmlElement
    implements IHTMLElementComponent
  {
    initElement = this.useInitElement(
      /* TODO: add wc-if directives */
      /* TODO: refactor asyncAndPromise system to work with helper functions */
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

  return new mainScope.BaseComponent<ILocalButtonScope>(
    tagName || 'button-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
