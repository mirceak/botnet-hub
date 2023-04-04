import type {
  IComponentExtendingElementScope,
  IHTMLBaseElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalButtonScope
  extends IComponentExtendingElementScope<HTMLButtonElement> {
  onClick?: () => void;
  ss?: string;
}

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  class Element extends mainScope.HTMLElement {
    private removeClickListener?: CallableFunction;

    initElement = this.useInitElement(mainScope, (scope: ILocalButtonScope) => {
      this.render(scope);

      if (scope?.onClick) {
        this.removeClickListener = mainScope.registerEventListener(
          this.children[0],
          'click',
          () => {
            scope?.onClick?.();
          }
        );
      }
    });

    render(scope?: ILocalButtonScope) {
      const buttonEl = document.createElement('button') as HTMLButtonElement &
        IHTMLBaseElementComponent;
      buttonEl.component = new mainScope.BaseElement(buttonEl);
      buttonEl.component.initElement(mainScope, scope?.elementAttributes);
      this.appendChild(buttonEl);
    }

    disconnectedCallback() {
      this.removeClickListener?.();
    }
  }

  return new mainScope.HTMLComponent<ILocalButtonScope>(
    tagName || 'button-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
