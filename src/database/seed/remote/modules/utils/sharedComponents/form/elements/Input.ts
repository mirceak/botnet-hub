import type { IHTMLElementClass } from '@remoteModules/frontend/engine/components/Main.js';

export const staticScope = {
  registered: false,
  componentName: 'input-component',
};

export const useComponent = (HTMLElementClass: IHTMLElementClass) => {
  return class DynamicTextComponent extends HTMLElementClass {
    constructor() {
      super();
    }

    connectedCallback() {
      const inputPropAttribute = this.getAttribute('@inputProp');
      const placeholderAttribute = this.getAttribute('placeholder');
      const parentScope = this.store.componentScopes.get(this.parentNode);

      if (!HTMLElementClass._hydrating) {
        this.innerHTML = `
          <input placeholder="${placeholderAttribute}"/>
        `;
      }

      this.children[0].addEventListener('input', (e) => {
        parentScope[inputPropAttribute] = (e.target as HTMLInputElement).value;
      });
    }
  };
};

export const registerComponent = async (
  HTMLElementClass: IHTMLElementClass,
) => {
  if (staticScope.registered) {
    return;
  }
  window.customElements.define(
    staticScope.componentName,
    useComponent(HTMLElementClass),
  );
  staticScope.registered = true;
};
