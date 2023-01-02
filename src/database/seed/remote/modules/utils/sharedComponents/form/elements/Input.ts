import type {
  IHTMLElementsScope,
  InstancedHTMLComponent,
} from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  onInput?: (value: string) => void;
  attributes?: IInputElementAttributes;
}

interface IInputElementAttributes {
  placeholder: string;
}

const getClass = (mainScope: IHTMLElementsScope) => {
  return class Component
    extends mainScope.HTMLElement
    implements InstancedHTMLComponent
  {
    private removeInputListener?: CallableFunction;

    constructor() {
      super();
    }

    init(scope: ILocalScope) {
      if (!mainScope.hydrating) {
        this.render(scope);
      }

      if (scope.onInput) {
        this.removeInputListener = mainScope.registerEventListener(
          this.children[0],
          'input',
          (e: InputEvent) => {
            scope.onInput?.((e.target as HTMLInputElement).value);
          },
        );
      }
    }

    render(scope?: ILocalScope) {
      this.innerHTML = `
        <input ${mainScope.getAttributesString(scope) || ''}/>
      `;
    }

    disconnectedCallback() {
      this.removeInputListener?.();
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'input-component';

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope));
      }
    };

    useComponent = (scope: ILocalScope) => {
      return this.getComponentScope(this.componentName, scope);
    };
  }

  return new Instance();
};

let componentInstance: ReturnType<typeof getSingleton>;

export default (mainScope: IHTMLElementsScope) => {
  if (!componentInstance || window.SSR) {
    if (!componentInstance) {
      componentInstance = getSingleton(mainScope);
    }
    componentInstance.initComponent(mainScope);
  }
  return componentInstance;
};
