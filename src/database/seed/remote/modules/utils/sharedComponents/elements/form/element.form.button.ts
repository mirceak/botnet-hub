import type {
  IHTMLElementsScope,
  IHTMLElementComponent,
  IComponentAttributes
} from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  onClick?: () => void;
  label?: string;
  attributes?: IComponentAttributes;
  elementAttributes?: IButtonElementAttributes;
}

interface IButtonElementAttributes {
  class?: string;
  type?: string;
}

const getClass = (mainScope: IHTMLElementsScope) => {
  return class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    private removeClickListener?: CallableFunction;

    constructor() {
      super();
    }

    init(scope: ILocalScope) {
      if (!mainScope.hydrating && scope.label) {
        this.render(scope);
      }

      if (scope.onClick) {
        this.removeClickListener = mainScope.registerEventListener(
          this.children[0],
          'click',
          () => {
            scope.onClick?.();
          }
        );
      }
    }

    render(scope?: ILocalScope) {
      this.innerHTML = `
        <button ${mainScope.getAttributesString(scope)}>${
        scope?.label || ''
      }</button>
      `;
    }

    disconnectedCallback() {
      this.removeClickListener?.();
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'button-component';

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope));
      }
    };

    useComponent = (scope: ILocalScope) => {
      return this.getComponentScope(this.componentName, scope);
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
