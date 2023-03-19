import type {
  IHTMLElementComponent,
  IHTMLElementComponentTemplate,
  TMainScope,
  IComponentAttributes
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  listGetter: () => IHTMLElementComponentTemplate['components'];
  noWatcher?: boolean;
  attributes?: IComponentAttributes;
}

const getComponent = (mainScope: TMainScope) => {
  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    private computeRender?: {
      props: CallableFunction[];
      computed: CallableFunction;
    };

    constructor() {
      super();
    }

    async init(scope: ILocalScope) {
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
      mainScope: TMainScope,
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
    'template-list-view-component',
    Component
  );
};

export default (mainScope: TMainScope) => getComponent(mainScope);
