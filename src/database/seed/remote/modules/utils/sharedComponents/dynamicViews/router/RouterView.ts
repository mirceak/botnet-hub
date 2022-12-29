import type {
  IHTMLElementComponentStaticScope,
  IHTMLElementsScope,
} from '@remoteModules/frontend/engine/components/Main.js';
import { IHTMLComponent } from '@remoteModules/frontend/engine/components/Main.js';
import { IRoute } from '@remoteModules/frontend/engine/router.js';

interface ILocalScope {
  fromConstructor?: boolean;
}

const getClass = (
  mainScope: IHTMLElementsScope,
  instance: ReturnType<typeof getSingleton>,
) => {
  return class Component extends window.HTMLElement {
    private _index?: number;

    constructor() {
      super();

      if (mainScope.hydrating) {
        this.init({ fromConstructor: true });
      }
    }

    async init(scope?: ILocalScope) {
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
      await mainScope.asyncHydrationCallback(async () => {
        this._index = instance.routerViewRegister.size;
        this.setAttribute('id', `${this._index}`);
        instance.routerViewRegister.add(this._index);
        const route = mainScope.router?.matchedRoutes?.[
          matchedRoutesLength - (this._index as number) - 1
        ] as IRoute;
        if (route) {
          const RouteComponent = mainScope.asyncRegisterComponent(
            route.component,
          ) as Promise<IHTMLComponent>;

          mainScope.asyncLoadComponentTemplate({
            target: this,
            components: [
              RouteComponent.then(
                (component) =>
                  component.useComponent() as IHTMLElementComponentStaticScope,
              ),
            ],
          });
        }
      });
    }

    disconnectedCallback() {
      if (this._index != undefined) {
        instance.routerViewRegister.delete(this._index);
      }
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent implements IHTMLComponent {
    componentName = 'router-view-component';
    routerViewRegister = new Set();

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope, this));
      }
    };

    useComponent = (scope?: ILocalScope) => {
      return this.getComponentScope(this.componentName, scope);
    };
  }

  return new Instance();
};

let componentInstance: ReturnType<typeof getSingleton>;

export const getInstance = (mainScope: IHTMLElementsScope) => {
  if (!componentInstance || window.SSR) {
    if (!componentInstance) {
      componentInstance = getSingleton(mainScope);
    }
    componentInstance.initComponent(mainScope);
  }
  return componentInstance;
};
