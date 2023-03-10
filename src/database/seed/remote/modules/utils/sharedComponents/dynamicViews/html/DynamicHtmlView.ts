import type {
  IHTMLElementComponent,
  IHTMLElementsScope,
  HTMLElementComponentStaticScope,
  IHTMLElementComponentStaticScope,
  IComponentAttributes
} from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  templateGetter: () => string | undefined;
  scopesGetter?: () => Record<string, HTMLElementComponentStaticScope>;
  noWatcher?: boolean;
  instant?: boolean;
  attributes?: IComponentAttributes;
}

const getClass = (mainScope: IHTMLElementsScope) => {
  return class Component
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

    init(scope: ILocalScope & { useComponent?: CallableFunction }) {
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
          props: [() => scope.templateGetter()],
          computed: () => {
            this.render(scope.templateGetter());
          }
        };
        mainScope.store.registerOnChangeCallback(
          this.computeRender.props,
          this.computeRender.computed
        );

        if (!mainScope.hydrating) {
          this.computeRender.computed();
        }
      }

      if (scope.instant && !mainScope.hydrating) {
        this.render(scope.templateGetter());
      }

      const parseChildren =
        (scopes: Record<string, HTMLElementComponentStaticScope>) =>
        (child: IHTMLElementComponent) => {
          if (child.tagName.toLowerCase() !== 'dynamic-html-view-component') {
            const scopeId = child.attributes.getNamedItem('x-scope')?.value;
            if (scopeId) {
              void window.customElements
                .whenDefined(child.tagName.toLowerCase())
                .then(async () => {
                  const scope = (await scopes[
                    scopeId
                  ]) as HTMLElementComponentStaticScope;
                  if (
                    (scope as IHTMLElementComponentStaticScope)
                      ?.componentName === child.tagName.toLowerCase()
                  ) {
                    child.init(scope);
                  } else {
                    throw new Error(
                      `Scope "${scopeId}" has the wrong composable! Please use the composable from "${child.tagName.toLowerCase()}" class!`
                    );
                  }
                });
            }

            if (child.children.length) {
              return [
                ...(child.children as unknown as IHTMLElementComponent[])
              ].forEach(parseChildren(scopes));
            }
          }
        };
      if (scope.scopesGetter) {
        const scopes = scope.scopesGetter();
        [...(this.children as unknown as IHTMLElementComponent[])].forEach(
          parseChildren(scopes)
        );
      }
    }

    render(value?: string) {
      this.innerHTML = `${value || ''}`;
    }

    disconnectedCallback() {
      if (this.computeRender) {
        mainScope.store.unRegisterOnChangeCallback(
          this.computeRender.props,
          this.computeRender.computed
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
