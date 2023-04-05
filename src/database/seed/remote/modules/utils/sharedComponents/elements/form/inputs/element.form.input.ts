import type {
  IMainScope,
  IComponentExtendingElementScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalInputScope
  extends IComponentExtendingElementScope<HTMLInputElement> {
  onInput?: (value: string) => void;
}

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject();

  class Element extends mainScope.BaseHtmlElement {
    private removeInputListener?: CallableFunction;

    initElement = this.useInitElement(mainScope, (scope?: ILocalInputScope) => {
      const inputTemplate = o('<input>', scope?.elementAttributes);

      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [inputTemplate]
      });

      if (scope?.onInput) {
        inputTemplate.element.then((el) => {
          this.removeInputListener = mainScope.registerEventListener(
            el,
            'input',
            (e) => {
              scope.onInput?.((e.target as HTMLInputElement).value);
            }
          );
        });
      }
    });

    disconnectedCallback() {
      this.removeInputListener?.();
    }
  }

  return new mainScope.BaseComponent<ILocalInputScope>(
    tagName || 'input-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
