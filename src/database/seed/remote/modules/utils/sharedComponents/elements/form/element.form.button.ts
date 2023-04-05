import type {
  IComponentExtendingElementScope,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalButtonScope
  extends IComponentExtendingElementScope<HTMLButtonElement> {
  onClick?: () => void;
  ss?: string;
}

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject();

  class Element extends mainScope.BaseHtmlElement {
    private removeClickListener?: CallableFunction;

    initElement = this.useInitElement(
      mainScope,
      (scope?: ILocalButtonScope) => {
        const buttonTemplate = o('<button>', scope?.elementAttributes);

        mainScope.asyncLoadComponentTemplate({
          target: this,
          components: [buttonTemplate]
        });

        if (scope?.onClick) {
          buttonTemplate.element.then((el) => {
            this.removeClickListener = mainScope.registerEventListener(
              el,
              'click',
              () => {
                scope?.onClick?.();
              }
            );
          });
        }
      }
    );

    disconnectedCallback() {
      this.removeClickListener?.();
    }
  }

  return new mainScope.BaseComponent<ILocalButtonScope>(
    tagName || 'button-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
