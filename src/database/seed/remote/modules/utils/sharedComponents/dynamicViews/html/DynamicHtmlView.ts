import type {
  IHTMLElementComponent,
  IMainScope,
  HTMLElementComponentStaticScope,
  IComponentStaticScope,
  IHTMLElementComponentStaticScope,
  IComponentScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IComponentScope {
  templateGetter: () => string | undefined;
  scopesGetter?: IHTMLElementComponentStaticScope['scopesGetter'];
  noWatcher?: boolean;
  instant?: boolean;
}

const getComponent = async (mainScope: IMainScope) => {
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
          props: [() => scope.templateGetter()],
          computed: () => {
            this.render(scope.templateGetter());
          }
        };
        mainScope.store.registerOnChangeCallback(
          this.computeRender.props,
          this.computeRender.computed
        );

        this.computeRender.computed();
      }

      if (scope.instant) {
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
                    (scope as IComponentStaticScope)?.componentName ===
                    child.tagName.toLowerCase()
                  ) {
                    child.initElement(scope);
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
        const scopes = await scope.scopesGetter();
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
  }

  return new mainScope.HTMLComponent<ILocalScope>(
    'dynamic-html-view-component',
    Component
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
