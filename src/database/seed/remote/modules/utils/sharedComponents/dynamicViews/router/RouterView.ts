import type {
  IHTMLElementComponentStaticScope,
  IHTMLElementsScope,
} from '@remoteModules/frontend/engine/components/Main.js';
import type { IComponent } from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  reset?: boolean;
  fromConstructor?: boolean;
}

export const staticScope = {
  registered: false,
  componentName: 'router-view-component',
  routerViewRegister: new Set(),
};

export const useComponent = (scope?: ILocalScope) => {
  return {
    componentName: staticScope.componentName,
    scope,
  };
};

export const initComponent = (mainScope: IHTMLElementsScope) => {
  return class RouterViewComponent extends window.HTMLElement {
    private _index?: number;

    constructor() {
      super();

      if (mainScope.hydrating) {
        this.init({ fromConstructor: true });
      }
    }

    async init(scope?: ILocalScope) {
      if (scope?.reset) {
        /*used for ssr*/
        staticScope.routerViewRegister.clear();
        scope.reset = false;
      }
      if (mainScope.hydrating && !scope?.fromConstructor) {
        /*avoid adding the route's component twice when hydrating SSR*/
        return;
      }
      const matchedRoutesLength = mainScope.router?.matchedRoutes
        ?.length as number;
      if (
        Object.keys(staticScope.routerViewRegister).length ===
        matchedRoutesLength
      ) {
        throw new Error('router-view has no matching route');
      }

      await mainScope.asyncHydrationCallback(async () => {
        this._index = staticScope.routerViewRegister.size;
        this.setAttribute('id', `${this._index}`);
        staticScope.routerViewRegister.add(this._index);
        const route =
          mainScope.router?.matchedRoutes?.[
            matchedRoutesLength - (this._index as number) - 1
          ];

        const RouteComponent = route?.component?.() as Promise<IComponent>;
        mainScope.asyncHydrationCallback(async () => {
          const component = await RouteComponent;
          if (
            !window.customElements.get(component.staticScope.componentName) ||
            mainScope.SSR
          ) {
            await component.registerComponent(mainScope);
          }
        });

        mainScope.asyncLoadComponentTemplate({
          target: this,
          components: [
            RouteComponent.then(
              (component) =>
                (
                  component as unknown as Record<
                    'useComponent',
                    () => IHTMLElementComponentStaticScope
                  >
                ).useComponent() as IHTMLElementComponentStaticScope,
            ),
          ],
        });
      });
    }

    disconnectedCallback() {
      if (this._index != undefined) {
        staticScope.routerViewRegister.delete(this._index);
      }
    }
  };
};
export const registerComponent = async (mainScope: IHTMLElementsScope) => {
  if (staticScope.registered) {
    if (!mainScope.SSR) {
      return;
    } else {
      initComponent(mainScope);
    }
  }

  if (!staticScope.registered) {
    window.customElements.define(
      staticScope.componentName,
      initComponent(mainScope),
    );
  }

  staticScope.registered = true;
};
