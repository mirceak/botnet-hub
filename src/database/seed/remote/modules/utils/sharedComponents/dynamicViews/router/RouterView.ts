import type {
  IHTMLElementsScope,
  InstancedHTMLComponent,
  IHTMLComponent,
  HTMLElementComponentStaticScope
} from '@remoteModules/frontend/engine/components/Main.js';
import type { IRoute } from '@remoteModules/frontend/engine/router.js';

interface ILocalScope {
  fromConstructor?: boolean;
  attributes?: IRouterViewAttributes;
}

interface IRouterViewAttributes {
  class: string;
}

const getComponents = (mainScope: IHTMLElementsScope) => ({
  _DynamicHtmlView: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
      )
  )
});

const getClass = (
  mainScope: IHTMLElementsScope,
  instance: ReturnType<typeof getSingleton>
) => {
  const { _DynamicHtmlView } = instance.registerComponents();

  return class Component
    extends mainScope.HTMLElement
    implements InstancedHTMLComponent
  {
    private _index?: number;

    constructor() {
      super();

      if (mainScope.hydrating) {
        this.init({ fromConstructor: true });
      }
    }

    init(scope?: ILocalScope) {
      if (mainScope.hydrating && !scope?.fromConstructor) {
        /*avoid adding the route's component twice when hydrating SSR*/
        return;
      }
      const matchedRoutesLength = mainScope.router?.matchedRoutes
        ?.length as number;
      if (
        Object.keys(instance.routerViewRegister).length === matchedRoutesLength
      ) {
        throw new Error('router-view has no matching route');
      }
      if (!this._index) {
        this._index = instance.routerViewRegister.size;
        this.setAttribute('id', `${this._index}`);
        instance.routerViewRegister.add(this._index);
      }

      if (scope?.attributes) {
        Object.keys(scope.attributes).forEach((key) => {
          this.setAttribute(
            key,
            scope.attributes
              ? `${scope.attributes[key as keyof typeof scope.attributes]}`
              : ''
          );
        });
      }

      const route = mainScope.router?.matchedRoutes?.[
        matchedRoutesLength - this._index - 1
      ] as IRoute;
      if (route) {
        const routeComponent =
          route.component as unknown as () => Promise<IHTMLComponent>;
        if (!mainScope.SSR && !mainScope.hydrating) {
          this.innerHTML = '';
        }
        void mainScope.asyncLoadComponentTemplate({
          target: this,
          components: [
            _DynamicHtmlView.then(async ({ useComponent }) => {
              const { componentName, useComponent: useRouteComponent } =
                await routeComponent();
              const routeScope = await route.scope?.();

              return useComponent({
                contentGetter: () =>
                  `<${componentName} x-scope="xScope"></${componentName}>`,
                scopesGetter: () => ({
                  xScope: useRouteComponent(
                    routeScope
                  ) as HTMLElementComponentStaticScope
                })
              });
            })
          ]
        });
      }
    }

    disconnectedCallback() {
      if (this._index != undefined) {
        instance.routerViewRegister.delete(this._index);
      }
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'router-view-component';
    routerViewRegister = new Set();

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope, this));
      } else if (mainScope.SSR) {
        this.registerComponents();
      }
    };

    registerComponents = () => {
      return getComponents(mainScope);
    };

    useComponent = (scope?: ILocalScope) => {
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
