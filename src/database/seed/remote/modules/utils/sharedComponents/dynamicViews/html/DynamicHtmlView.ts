import type {
  InstancedHTMLComponent,
  IHTMLElementsScope,
  HTMLElementComponentStaticScope,
} from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  contentGetter: () => string | undefined;
  scopesGetter?: () => Record<string, HTMLElementComponentStaticScope>;
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
          props: [() => scope.contentGetter()],
          computed: () => {
            this.render(scope.contentGetter());
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

      if (scope.instant && !mainScope.hydrating) {
        this.render(scope.contentGetter());
      }

      if (scope.scopesGetter) {
        const scopes = scope.scopesGetter();
        [...(this.children as unknown as InstancedHTMLComponent[])].forEach(
          (child) => {
            if (child.attributes.getNamedItem('x-scope')) {
              window.customElements
                .whenDefined(child.tagName.toLowerCase())
                .then(async () => {
                  const scopeId =
                    child.attributes.getNamedItem('x-scope')?.value;

                  if (scopeId) {
                    const scope = await scopes[scopeId];
                    if (scope?.componentName === child.tagName.toLowerCase()) {
                      child.init(scope);
                    } else {
                      throw new Error(
                        `Scope ${scopeId} has the wrong composable! Please use the composable from "${child.tagName.toLowerCase()}" class!`,
                      );
                    }
                  } else {
                    throw new Error('ScopeId not provided!');
                  }
                });
            }
          },
        );
      }
    }

    render(value?: string) {
      this.innerHTML = `${value}`;
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
    componentName = 'dynamic-html-view-component';

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
