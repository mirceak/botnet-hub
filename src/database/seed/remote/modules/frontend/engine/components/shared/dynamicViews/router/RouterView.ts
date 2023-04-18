import type {
  IBaseWCScope,
  IWCElement,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';
import type { Route } from '/remoteModules/frontend/engine/router.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject();
  const routerViewRegister = new Set();

  class Element extends mainScope.BaseHtmlElement implements IWCElement {
    private _index?: number;

    initElement = this.useInitElement(
      mainScope,
      async (scope?: IBaseWCScope) => {
        const matchedRoutesLength = mainScope.router?.matchedRoutes
          ?.length as number;
        if (Object.keys(routerViewRegister).length === matchedRoutesLength) {
          throw new Error('router-view has no matching route');
        }

        if (this._index == null) {
          this._index = routerViewRegister.size;
          this.setAttribute('id', `rv-id-${this._index}`);
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
        ] as Route;

        if (route) {
          const routeComponent = route.component as NonNullable<
            typeof route.component
          >;
          this.innerHTML = '';

          mainScope.asyncLoadComponentTemplate({
            target: this,
            components: [
              async () => {
                const componentScope = await routeComponent();

                return o(
                  `<${componentScope.tagName}>` as never,
                  componentScope as never
                );
              }
            ]
          });
        }
      }
    );

    disconnectedCallback() {
      if (this._index != undefined) {
        routerViewRegister.delete(this._index);
      }
    }
  }

  return new mainScope.BaseWebComponent(
    tagName || 'router-view-component',
    Element
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
