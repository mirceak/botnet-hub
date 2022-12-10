import type { IHTMLElementClass } from '@remoteModules/frontend/engine/components/Main.js';

export const staticScope = {
  registered: false,
  componentName: 'dynamic-text-component',
};

export const useComponent = (HTMLElementClass: IHTMLElementClass) => {
  return class DynamicTextComponent extends HTMLElementClass {
    constructor() {
      super();
    }

    connectedCallback() {
      const storeRefProp = this.getAttribute('@contentProp');
      const getParentScope = this.store.componentScopes.get(this.parentNode);

      const renderCompute = {
        props: [() => getParentScope()?.[storeRefProp]],
        computed: () => {
          const text = getParentScope()?.[storeRefProp];
          if (!HTMLElementClass._hydrating) {
            this.innerHTML = `
            <h1>${text}</h1>
          `;
          }
        },
      };

      this.store.registerOnChangeCallback(
        renderCompute.props,
        renderCompute.computed,
      );

      renderCompute.computed();
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
