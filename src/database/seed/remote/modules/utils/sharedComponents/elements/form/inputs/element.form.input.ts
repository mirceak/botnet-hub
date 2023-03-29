import type {
  IMainScope,
  IComponentExtendingElementScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope
  extends IComponentExtendingElementScope<HTMLInputElement> {
  onInput?: (value: string) => void;
}

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  class Element extends mainScope.HTMLElement {
    private removeInputListener?: CallableFunction;

    constructor() {
      super();
    }

    async initElement(scope: ILocalScope) {
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
    }

    render(scope: ILocalScope) {
      const inputEl = document.createElement('input');
      Object.assign(inputEl, scope.elementAttributes);
      this.appendChild(inputEl);
    }

    disconnectedCallback() {
      this.removeInputListener?.();
    }
  }

  return new mainScope.HTMLComponent<ILocalScope>(
    tagName || 'input-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
