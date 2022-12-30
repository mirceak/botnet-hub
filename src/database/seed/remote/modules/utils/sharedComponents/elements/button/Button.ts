import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';
import { IHTMLComponent } from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  onClick: (value: string) => void;
  label?: string;
}

const getClass = (mainScope: IHTMLElementsScope) => {
  return class Component extends window.HTMLElement {
    private onClick?: EventListenerOrEventListenerObject;
    constructor() {
      super();
    }

    init(scope: ILocalScope) {
      this.onClick = (e: Event) => {
        scope.onClick((e.target as HTMLInputElement).value);
      };

      if (!mainScope.hydrating) {
        this.innerHTML = `
          <button>${scope.label}</button>
        `;
      }

      this.children[0].addEventListener('click', this.onClick);
    }

    disconnectedCallback() {
      if (this.children[0]) {
        this.children[0].removeEventListener(
          'click',
          this.onClick as NonNullable<typeof this.onClick>,
        );
      }
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent implements IHTMLComponent {
    componentName = 'button-component';

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
