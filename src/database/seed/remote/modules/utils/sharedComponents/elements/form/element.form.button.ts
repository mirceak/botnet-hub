import type {
  IMainScope,
  IComponentExtendingElementScope
} from '/remoteModules/frontend/engine/components/Main.js';

export interface ILocalScope
  extends IComponentExtendingElementScope<HTMLButtonElement> {
  onClick?: () => void;
  label: string;
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
      const buttonEl = document.createElement('button');
      Object.assign(buttonEl, scope?.elementAttributes);
      if (scope?.label) {
        buttonEl.innerText = scope.label;
      }
      this.appendChild(buttonEl);
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
