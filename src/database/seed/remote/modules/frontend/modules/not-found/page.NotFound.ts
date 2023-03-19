import type {
  IHTMLElementComponent,
  TMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: TMainScope) => {
  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    constructor() {
      super();
    }

    async init() {
      const template = window.document.createElement('template');
      template.innerHTML = `<h1>Page not found!</h1>`;
      this.appendChild(template.content.cloneNode(true));
      template.remove();
    }
  }

  return new mainScope.HTMLComponent('not-found-component', Component);
};

export default (mainScope: TMainScope) => getComponent(mainScope);
