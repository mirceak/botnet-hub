import type {
  TMainScope,
  IHTMLElementComponent,
  IComponentAttributes
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  onInput?: (value: string) => void;
  attributes?: IComponentAttributes;
  elementAttributes?: IInputElementAttributes;
}

interface IInputElementAttributes {
  placeholder?: string;
  class?: string;
  type?: string;
  autocomplete?: string;
}

const getComponent = async (mainScope: TMainScope) => {
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
          this.children[0] as HTMLInputElement,
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

  return new mainScope.HTMLComponent<ILocalScope>('input-component', Component);
};

export default async (mainScope: TMainScope) => getComponent(mainScope);
