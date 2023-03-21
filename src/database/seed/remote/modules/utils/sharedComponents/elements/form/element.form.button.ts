import type {
  IMainScope,
  IHTMLElementComponent,
  IComponentScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IComponentScope {
  onClick?: () => void;
  label?: string;
  elementAttributes?: IButtonElementAttributes;
}

interface IButtonElementAttributes {
  class?: string;
  type?: string;
}

const getComponent = async (mainScope: IMainScope) => {
  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    private removeClickListener?: CallableFunction;

    constructor() {
      super();
    }

    async init(scope: ILocalScope) {
      if (scope.label) {
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
  }

  return new mainScope.HTMLComponent<ILocalScope>(
    'button-component',
    Component
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
