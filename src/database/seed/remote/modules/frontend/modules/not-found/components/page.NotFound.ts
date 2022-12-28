import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

const templateHtml = `
<h1>Page not found!</h1>
`;

export const staticScope = {
  registered: false,
  componentName: 'not-found-component',
};

export const useComponent = () => {
  return {
    componentName: staticScope.componentName,
  };
};

const initComponent = (mainScope: IHTMLElementsScope) => {
  return class NotFoundComponent extends window.HTMLElement {
    constructor() {
      super();
    }

    init() {
      if (!mainScope.hydrating) {
        const template = window.document.createElement('template');
        template.innerHTML = templateHtml as string;
        this.appendChild(template.content.cloneNode(true));
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
