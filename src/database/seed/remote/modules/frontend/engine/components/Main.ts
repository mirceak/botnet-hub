import type { IStore } from '@remoteModules/frontend/engine/store.js';

export interface IComponent {
  registerComponent: (HTMLElement: typeof HTMLElementClass) => Promise<void>;
  staticScope: {
    componentName: string;
    registered: boolean;
  };
}

export type IHTMLElementClass = typeof HTMLElementClass;

class HTMLElementClass extends window.HTMLElement {
  static _store: IStore;
  static _hydrating = !window.SSR && window._shouldHydrate;
  store: IStore;
  constructor() {
    super();
    this.store = HTMLElementClass._store;
  }
}

export const useMainComponent = () => {
  return class HomeComponent extends window.HTMLElement {
    constructor() {
      super();
    }

    async connectedCallback() {
      // TODO: if _hydrating load all modules in a module pool and extract code from there instead of importing
      // TODO: for async components add a method that
      const template = window.document.createElement('template');

      const { useStore } = await import(
        '@remoteModules/frontend/engine/store.js'
      );
      HTMLElementClass._store = useStore();

      const { useRouter } = await import(
        '@remoteModules/frontend/engine/router.js'
      );
      const router = await useRouter();

      const { registerComponent, staticScope } =
        await router.currentRoute.component();

      await registerComponent(HTMLElementClass);
      template.innerHTML = `<${staticScope.componentName}/>`;

      if (!HTMLElementClass._hydrating) {
        this.appendChild(template.content.cloneNode(true));
      }

      if (window.onHTMLReady) {
        window.onHTMLReady();
      } else {
        HTMLElementClass._hydrating = false;
      }
    }
  };
};

export const registerMainComponent = async () => {
  window.customElements.define('main-component', useMainComponent());
};

if (!window.SSR) {
  await registerMainComponent();
} else {
  exports = {
    useMainComponent,
    registerMainComponent,
  };
}
