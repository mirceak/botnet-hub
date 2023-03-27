import type {
  IMainScope,
  IComponentScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IComponentScope {
  onClick?: () => void;
  label: string;
  elementAttributes?: IButtonElementAttributes;
}

interface IButtonElementAttributes {
  class?: string;
  type?: string;
}

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  class Element extends mainScope.HTMLElement {
    private removeClickListener?: CallableFunction;

    constructor() {
      super();
    }

    async initElement(scope?: ILocalScope) {
      if (scope?.label) {
        this.render(scope);
      }

      if (scope?.onClick) {
        this.removeClickListener = mainScope.registerEventListener(
          this.children[0],
          'click',
          () => {
            scope?.onClick?.();
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
    tagName || 'button-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
