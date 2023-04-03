import type {
  IMainScope,
  IHTMLBaseElementComponent,
  IComponentExtendingElementScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalInputScope
  extends IComponentExtendingElementScope<HTMLInputElement> {
  onInput?: (value: string) => void;
}

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  class Element extends mainScope.HTMLElement {
    private removeInputListener?: CallableFunction;

    initElement = this.useInitElement(mainScope, (scope: ILocalInputScope) => {
      this.render(scope);
      if (scope.onInput) {
        this.removeInputListener = mainScope.registerEventListener(
          this.children[0] as HTMLInputElement,
          'input',
          (e) => {
            scope.onInput?.((e.target as HTMLInputElement).value);
          }
        );
      }
    });

    render(scope: ILocalInputScope) {
      const inputEl = document.createElement('input') as HTMLInputElement &
        IHTMLBaseElementComponent;
      inputEl.component = new mainScope.BaseElement(inputEl);
      inputEl.component.initElement(mainScope, scope?.elementAttributes);
      this.appendChild(inputEl);
    }

    disconnectedCallback() {
      this.removeInputListener?.();
    }
  }

  return new mainScope.HTMLComponent<ILocalInputScope>(
    tagName || 'input-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
