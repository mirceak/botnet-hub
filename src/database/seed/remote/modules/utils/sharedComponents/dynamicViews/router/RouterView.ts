import type {
  HTMLElementComponentStaticScope,
  IComponentAttributes,
  IHTMLComponent,
  IHTMLElementComponent,
  TMainScope
} from '/remoteModules/frontend/engine/components/Main.js';
import type { IRoute } from '/remoteModules/frontend/engine/router.js';

interface ILocalScope {
  fromConstructor?: boolean;
  attributes?: IComponentAttributes;
}

const getComponent = async (mainScope: TMainScope) => {
  const routerViewRegister = new Set();

  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    private _index?: number;

    constructor() {
      super();
    }

    init(scope?: ILocalScope) {
      const matchedRoutesLength = mainScope.router?.matchedRoutes
        ?.length as number;
      if (Object.keys(routerViewRegister).length === matchedRoutesLength) {
        throw new Error('router-view has no matching route');
      }

      if (this._index == null) {
        this._index = routerViewRegister.size;
        this.setAttribute('id', `${this._index}`);
        routerViewRegister.add(this._index);
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
          route.component as unknown as Promise<IHTMLComponent>;
        this.innerHTML = '';

        void mainScope.asyncLoadComponentTemplate({
          target: this,
          components: [
            async () => {
              const { componentName, useComponent: useRouteComponent } =
                await routeComponent;
              return {
                template: `<${componentName} xScope="xScope${this._index}">
</${componentName}>` /* xScope${this._index} -> avoids nested template parsing errors because the first scope would be sent to all other instances caring the same scope names */,
                scopesGetter: () => {
                  return {
                    [`xScope${this._index}`]: useRouteComponent({
                      scopesGetter: route.scopesGetter
                    }) as HTMLElementComponentStaticScope
                  };
                }
              };
            }
          ]
        });
      }
    }

    disconnectedCallback() {
      if (this._index != undefined) {
        routerViewRegister.delete(this._index);
      }
    }
  }

  return new mainScope.HTMLComponent<ILocalScope>(
    'router-view-component',
    Component
  );
};

export default (mainScope: TMainScope) => getComponent(mainScope);
