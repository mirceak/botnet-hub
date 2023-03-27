import type {
  IMainScope,
  IComponentScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IComponentScope {
  onInput?: (value: string) => void;
  elementAttributes?: IInputElementAttributes;
}

interface IInputElementAttributes {
  placeholder?: string;
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
          this.children[0],
          'input',
          (e) => {
            scope.onInput?.((e.target as HTMLInputElement).value);
          }
        );
      }
    }

    render(scope: ILocalScope) {
      this.innerHTML = `
        <input ${mainScope.getAttributesString(scope)}/>
      `;
    }

    disconnectedCallback() {
      this.removeInputListener?.();
    }
  }

  return new mainScope.HTMLComponent<ILocalScope>(
    tagName || 'select-input-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
