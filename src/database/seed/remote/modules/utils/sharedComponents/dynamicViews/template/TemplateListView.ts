import type {
  InstancedHTMLComponent,
  IHTMLElementComponentTemplate,
  IHTMLElementsScope,
} from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  listGetter: () => IHTMLElementComponentTemplate['components'];
  noWatcher?: boolean;
  instant?: boolean;
}

const getClass = (mainScope: IHTMLElementsScope) => {
  return class Component
    extends mainScope.HTMLElement
    implements InstancedHTMLComponent
  {
    private computeRender?: {
      props: CallableFunction[];
      computed: CallableFunction;
    };

    constructor() {
      super();
    }

    init(scope: ILocalScope) {
      if (!scope.noWatcher) {
        this.computeRender = {
          props: [() => scope.listGetter()],
          computed: () => {
            this.render(mainScope, scope.listGetter());
          },
        };
        mainScope.store.registerOnChangeCallback(
          this.computeRender.props,
          this.computeRender.computed,
        );

        if (!mainScope.hydrating) {
          this.computeRender.computed();
        }
      }

      if (scope.instant) {
        this.render(mainScope, scope.listGetter());
      }
    }

    render(
      mainScope: IHTMLElementsScope,
      value: IHTMLElementComponentTemplate['components'],
    ) {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: value,
      });
    }

    disconnectedCallback() {
      if (this.computeRender) {
        mainScope.store.unRegisterOnChangeCallback(
          this.computeRender.props,
          this.computeRender.computed,
        );
      }
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'template-list-view-component';

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
