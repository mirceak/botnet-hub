import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';
import type { Route } from '/remoteModules/frontend/engine/router.js';

const getComponent = async (mainScope: IMainScope) => {
  const { o } = mainScope.useComponentsObject();
  const routerViewRegister = new Set();

  return mainScope.useComponentRegister('router-view-component', (options) => {
    let _index: null | number;

    options.useOnDisconnectedCallback(() => {
      if (_index != undefined) {
        routerViewRegister.delete(_index);
      }
    });

    options.useInitElement(async () => {
      const matchedRoutesLength = mainScope.router?.matchedRoutes
        ?.length as number;
      if (Object.keys(routerViewRegister).length === matchedRoutesLength) {
        throw new Error('router-view has no matching route');
      }

      if (_index == null) {
        _index = routerViewRegister.size;
        options.el.setAttribute('id', `rv-id-${_index}`);
        routerViewRegister.add(_index);
      }

      const route = mainScope.router?.matchedRoutes?.[
        matchedRoutesLength - _index - 1
      ] as Route;

      if (route) {
        const routeComponent = route.component as NonNullable<
          typeof route.component
        >;
        options.el.innerHTML = '';

        options.asyncLoadComponentTemplate({
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
    });
  });
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
