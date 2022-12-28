import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

export const staticScope = {
  registered: false,
  componentName: 'input-component',
};

interface ILocalScope {
  onInput: (value: string) => void;
  placeholder: string;
}

export const useComponent = (scope: ILocalScope) => {
  return {
    componentName: staticScope.componentName,
    scope,
  };
};

const initComponent = (mainScope: IHTMLElementsScope) => {
  return class InputComponent extends window.HTMLElement {
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
      initComponent(mainScope),
    );
  }

  staticScope.registered = true;
};
