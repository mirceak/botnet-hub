import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  onInput: (value: string) => void;
  placeholder: string;
}

const getClass = (mainScope: IHTMLElementsScope) => {
  return class Component extends window.HTMLElement {
    private onInput?: EventListenerOrEventListenerObject;
    constructor() {
      super();
    }

    init(scope: ILocalScope) {
      this.onInput = (e: Event) => {
        scope.onInput((e.target as HTMLInputElement).value);
      };

      if (!mainScope.hydrating) {
        this.innerHTML = `
          <input placeholder="${scope.placeholder}"/>
        `;
      }

      this.children[0].addEventListener('input', this.onInput);
    }

    disconnectedCallback() {
      if (this.children[0]) {
        this.children[0].removeEventListener(
          'input',
          this.onInput as NonNullable<typeof this.onInput>,
        );
      }
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
