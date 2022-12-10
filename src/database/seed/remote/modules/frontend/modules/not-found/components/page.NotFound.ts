import type { IHTMLElementClass } from '@remoteModules/frontend/engine/components/Main.js';

const templateHtml = `
<h1>Page not found!</h1>
`;

export const staticScope = {
  registered: false,
  componentName: 'not-found-component',
};

export const useComponent = (HTMLElementClass: IHTMLElementClass) => {
  return class HomeComponent extends window.HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      const template = window.document.createElement('template');
      template.innerHTML = templateHtml as string;
      if (!HTMLElementClass._hydrating) {
        this.appendChild(template.content.cloneNode(true));
      }
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
