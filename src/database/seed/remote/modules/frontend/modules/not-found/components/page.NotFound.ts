import type {
  InstancedHTMLComponent,
  IHTMLElementsScope
} from '@remoteModules/frontend/engine/components/Main.js';

const templateHtml = `
<h1>Page not found!</h1>
`;

const getClass = (mainScope: IHTMLElementsScope) => {
  return class Component
    extends mainScope.HTMLElement
    implements InstancedHTMLComponent
  {
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

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'not-found-component';

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope));
      }
    };

    useComponent = () => {
      return this.getComponentScope(this.componentName);
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
