import type {
  IHTMLElementComponentTemplate,
  IMainScope,
  IElementScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IElementScope {
  listGetter: () => IHTMLElementComponentTemplate['components'];
  noWatcher?: boolean;
}

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  class Element extends mainScope.HTMLElement {
    private computeRender?: {
      props: CallableFunction[];
      computed: CallableFunction;
    };

    constructor() {
      super();
    }

    async initElement(scope: ILocalScope) {
      if (scope.attributes) {
        Object.keys(scope.attributes).forEach((key) => {
          this.setAttribute(
            key,
            scope.attributes
              ? `${scope.attributes[key as keyof typeof scope.attributes]}`
              : ''
          );
        });
      }

      if (!scope.noWatcher) {
        this.computeRender = {
          props: [() => scope.listGetter()],
          computed: () => {
            this.render(mainScope, scope.listGetter());
          }
        };
        mainScope.store.registerOnChangeCallback(
          this.computeRender.props,
          this.computeRender.computed
        );
      }

      if (!scope.noWatcher) {
        this.computeRender?.computed();
      } else {
        this.render(mainScope, scope.listGetter());
      }
    }

    render(
      mainScope: IMainScope,
      value: IHTMLElementComponentTemplate['components']
    ) {
      void mainScope.asyncLoadComponentTemplate({
        target: this,
        components: value
      });
    }

    disconnectedCallback() {
      if (this.computeRender) {
        mainScope.store.unRegisterOnChangeCallback(
          this.computeRender.props,
          this.computeRender.computed
        );
      }
    }
  }

  return new mainScope.HTMLComponent<ILocalScope>(
    tagName || 'template-list-view-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
