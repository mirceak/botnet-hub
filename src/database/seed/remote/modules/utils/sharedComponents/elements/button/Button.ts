import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

export const staticScope = {
  registered: false,
  componentName: 'button-component',
};

interface ILocalScope {
  onClick: (value: string) => void;
  label?: string;
}

export const useComponent = (scope: ILocalScope) => {
  return {
    componentName: staticScope.componentName,
    scope,
  };
};

const initComponent = (mainScope: IHTMLElementsScope) => {
  return class ButtonComponent extends window.HTMLElement {
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

export const registerComponent = async (mainScope: IHTMLElementsScope) => {
  if (staticScope.registered) {
    if (!mainScope.SSR) {
      return;
    } else {
      initComponent(mainScope);
    }
  }

  if (!staticScope.registered) {
    window.customElements.define(
      staticScope.componentName,
      initComponent(mainScope) as CustomElementConstructor,
    );
  }

  staticScope.registered = true;
};
