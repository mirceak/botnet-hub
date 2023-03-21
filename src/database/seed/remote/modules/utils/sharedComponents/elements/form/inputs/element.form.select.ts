import type {
  IMainScope,
  IHTMLElementComponent,
  IComponentScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IComponentScope {
  onInput?: (value: string) => void;
  elementAttributes?: IInputElementAttributes;
}

interface IInputElementAttributes {
  placeholder?: string;
}

const getComponent = async (mainScope: IMainScope) => {
  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    private removeInputListener?: CallableFunction;

    constructor() {
      super();
    }

    async init(scope: ILocalScope) {
      this.render(scope);

      if (scope.onInput) {
        this.removeInputListener = mainScope.registerEventListener(
          this.children[0],
          'input',
          (e: InputEvent) => {
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
    'select-input-component',
    Component
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
