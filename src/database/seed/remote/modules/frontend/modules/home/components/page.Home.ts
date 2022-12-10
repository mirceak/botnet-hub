import type { IHTMLElementClass } from '@remoteModules/frontend/engine/components/Main.js';

export const staticScope = {
  registered: false,
  componentName: 'home-component',
};

// const AsyncComponent = async (
//   parentElement: Element,
//   componentTag: string,
//   attributes: string[],
// ) => {};

export const useComponent = (HTMLElementClass: IHTMLElementClass) => {
  return class HomeComponent extends HTMLElementClass {
    constructor() {
      super();
    }

    connectedCallback() {
      const localScope = this.store.data.modules?.home;
      this.store.componentScopes.set(this, localScope);

      if (!HTMLElementClass._hydrating) {
        this.innerHTML = `
<dynamic-text-component @contentProp="titleWithName"></dynamic-text-component>
<input-component @inputProp="nameInput" placeholder="Enter Your Name"></input-component>
`;
      }

      delete this.store.data.modules;
      this.store.data.modules = {
        home: {
          title: 'Welcome',
          titleWithName: null as string | null,
          nameInput: null as string | null,
        },
      };

      localScope.title = 'Hey ther2e!';
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

  const dynamicTextComponent = await import(
    '@remoteModules/utils/sharedComponents/dynamicViews/DynamicText.js'
  );
  await dynamicTextComponent.registerComponent(HTMLElementClass);

  const inputComponent = await import(
    '@remoteModules/utils/sharedComponents/form/elements/Input.js'
  );
  await inputComponent.registerComponent(HTMLElementClass);

  staticScope.registered = true;
};
