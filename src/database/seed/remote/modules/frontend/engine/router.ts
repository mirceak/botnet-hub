import type {
  TMainScope,
  IHTMLElementComponent
} from '/remoteModules/frontend/engine/components/Main.js';
import { IComponentStaticScope } from '/remoteModules/frontend/engine/components/Main.js';

export interface Route {
  path: string;
  name?: string;
  redirect?: string;
  component?: () => Promise<IComponentStaticScope>;
  children?: Route[];
  parent?: Route;
  computedPath?: string;
  _symbol?: symbol;
}

export interface Router {
  ready?: true;
  routes: Route[];
  push: (name: string, fromBrowser?: boolean) => Promise<void>;
  redirect: (name: string) => Promise<void>;
  onPopState: (e: PopStateEvent) => void;
  onDestroy: () => void;
  removePopstateListener?: CallableFunction;
  currentRoute?: Route;
  matchedRoutes?: Route[];
}

interface IPopStateEvent extends PopStateEvent {
  state: IBrowserHistoryState;
}

interface IBrowserHistoryState {
  name: string;
}

let pathToRegexp: typeof import('path-to-regexp/dist/index.js')['pathToRegexp'];

const {
  ProxyRouterViewComponent,
  LayoutMainComponent,
  PageHomeComponent,
  PageAuthComponent,
  PageAboutComponent,
  PageComponentsComponent,
  Page404Component
} = {
  ProxyRouterViewComponent: (mainScope: TMainScope) =>
    mainScope.asyncRegisterComponent(
      import(
        '/remoteModules/utils/sharedComponents/dynamicViews/router/ProxyRouterView.js'
      )
    ),
  LayoutMainComponent: (mainScope: TMainScope) =>
    mainScope.asyncRegisterComponent(
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/layout.main.js'
      )
    ),
  PageHomeComponent: (mainScope: TMainScope) =>
    mainScope.asyncRegisterComponent(
      import('/remoteModules/frontend/modules/home/pages/page.Home.js')
    ),
  PageAuthComponent: (mainScope: TMainScope) =>
    mainScope.asyncRegisterComponent(
      import('/remoteModules/frontend/modules/auth/pages/page.Auth.js')
    ),
  PageAboutComponent: (mainScope: TMainScope) =>
    mainScope.asyncRegisterComponent(
      import('/remoteModules/frontend/modules/home/pages/page.About.js')
    ),
  PageComponentsComponent: (mainScope: TMainScope) =>
    mainScope.asyncRegisterComponent(
      import(
        '/remoteModules/frontend/modules/home/pages/dev/page.Components.js'
      )
    ),
  Page404Component: (mainScope: TMainScope) =>
    mainScope.asyncRegisterComponent(
      import('/remoteModules/frontend/modules/not-found/page.NotFound.js')
    )
};

const mainLayoutComponents = async (mainScope: TMainScope) => ({
  _Header: mainScope.asyncRegisterComponent(
    import(
      '/remoteModules/utils/sharedComponents/elements/layout/main/header/header.main.js'
    )
  ),
  _Footer: mainScope.asyncRegisterComponent(
    import(
      '/remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.js'
    )
  ),
  _Nav: mainScope.asyncRegisterComponent(
    import(
      '/remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.js'
    )
  )
});

const getRouter = (): Router => {
  return {
    routes: [] as Route[],
    onPopState(e: IPopStateEvent) {
      return this.push(e.state.name, true);
    },
    onDestroy() {
      this.removePopstateListener?.();
    },
    async push(name, replaceRoute = false) {
      const matched = this.routes.reduce(
        matchedRouteNameReducer(name),
        [] as Route[]
      );

      if (matched?.length) {
        if (matched[0].redirect) {
          return this.redirect(matched[0].redirect);
        }
        const firstMatchingRouteIndex = matched
          ?.slice()
          .reverse()
          .findIndex((currentRoute, index) => {
            return (
              currentRoute._symbol !==
              this.matchedRoutes?.slice().reverse()[index]?._symbol
            );
          });
        const oldMatchedRoutes = this.matchedRoutes?.splice(
          0,
          this.matchedRoutes.length,
          ...matched
        );
        this.currentRoute = matched[0];

        if (!replaceRoute) {
          window.history.pushState(
            { name: matched[0].name, computedPath: matched[0].computedPath },
            '',
            (matched[0].computedPath as string) + (window.location.search || '')
          );
        } else {
          window.history.replaceState(
            { name: matched[0].name, computedPath: matched[0].computedPath },
            '',
            (matched[0].computedPath as string) + (window.location.search || '')
          );
        }

        /*Need to reset the stack of router-views*/
        /*Remove all router-views whose route is no longer matching and add the first one of those back and let it pull in its new component*/
        if (firstMatchingRouteIndex !== -1) {
          const firstRouterView = window.document.getElementById(
            `${firstMatchingRouteIndex}`
          );
          const firstRouterViewParent = firstRouterView?.parentElement;
          if (firstRouterViewParent) {
            oldMatchedRoutes?.forEach((_route, index) => {
              if (index >= firstMatchingRouteIndex + 1) {
                window.document.getElementById(`${index}`)?.remove();
              }
            });
            await (
              window.document.getElementById(
                `${firstMatchingRouteIndex}`
              ) as IHTMLElementComponent
            )?.init();
          }
        }
      } else {
        throw new Error(`Route "${name}" not found`);
      }
    },
    async redirect(name) {
      return this.push(name, true);
    }
  };
};

export const useRoutes = (mainScope: TMainScope): Route[] => [
  {
    path: '/',
    name: 'root-home',
    redirect: 'home'
  },
  {
    path: '/home',
    component: () =>
      LayoutMainComponent(mainScope).then(({ useComponent }) =>
        useComponent({ scopesGetter: mainLayoutComponents })
      ),
    children: [
      {
        path: '',
        component: () => ProxyRouterViewComponent(mainScope),
        children: [
          {
            path: '',
            name: 'home',
            component: () => PageHomeComponent(mainScope)
          }
        ]
      },
      {
        path: 'components',
        name: 'components',
        component: () => PageComponentsComponent(mainScope)
      },
      {
        path: 'about',
        name: 'about',
        component: () =>
          PageAboutComponent(mainScope).then(async ({ useComponent }) => {
            return await useComponent({
              sex: 'as'
            });
          })
      }
    ]
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => PageAuthComponent(mainScope)
  },
  {
    path: '/not-found',
    name: '404',
    component: () => Page404Component(mainScope)
  },
  {
    path: '(.*)',
    name: 'not-found',
    redirect: '404'
  }
];

export const useRouter = async (mainScope: TMainScope): Promise<Router> => {
  const router = getRouter();
  if (!pathToRegexp) {
    /*TODO: Replace with own implementation of path interpreter*/
    pathToRegexp = await import(
      `${'/node_modules/path-to-regexp/dist.es2015/index.js'}`
    ).then((module) => module.pathToRegexp);
  }

  router.routes.push(...(useRoutes(mainScope) as Route[]).map(routeMapper));

  router.matchedRoutes = router.routes.reduce(
    matchedRoutePathReducer(window.location.pathname),
    [] as Route[]
  );

  if (router.matchedRoutes.length) {
    router.currentRoute = router.matchedRoutes[0];
  } else {
    throw new Error('No route matched path');
  }

  if (router.currentRoute && router.currentRoute.redirect) {
    await router.redirect(router.currentRoute.redirect);
  }

  window.history.replaceState(
    {
      name: router.currentRoute.name,
      computedPath: router.currentRoute.computedPath
    },
    '',
    (router.currentRoute.computedPath as string) +
      (window.location.search || '')
  );

  router.removePopstateListener = mainScope.registerEventListener(
    window,
    'popstate',
    router.onPopState.bind(router)
  );

  router.ready = true;

  return router;
};

const routeMapper = (currentRoute: Route): Route => {
  if (currentRoute.children?.length) {
    currentRoute.children = currentRoute.children.map((childRoute) => {
      childRoute.parent = currentRoute;
      childRoute.computedPath =
        (currentRoute.computedPath || currentRoute.path) +
        (childRoute.path ? '/' + childRoute.path : '');
      return childRoute;
    });
    currentRoute.computedPath = currentRoute.path;
    currentRoute.children?.map(routeMapper);
  } else {
    if (!currentRoute.children && !currentRoute.parent) {
      currentRoute.computedPath = currentRoute.path;
    }
  }
  currentRoute._symbol = Symbol();
  return currentRoute;
};

const matchedRoutePathReducer =
  (fullPath: string) =>
  (reduced: Route[], currentRoute: Route): Route[] => {
    if (reduced.length) {
      return reduced;
    }
    if (currentRoute.children?.length) {
      currentRoute.children?.reduce(matchedRoutePathReducer(fullPath), reduced);
    } else {
      const matched =
        pathToRegexp(currentRoute.computedPath as string).exec(fullPath) ||
        (currentRoute.path === '' && currentRoute.parent
          ? pathToRegexp(currentRoute.parent.computedPath as string).exec(
              fullPath
            )
          : undefined);
      if (matched) {
        let parent = currentRoute.parent;
        reduced.push(currentRoute);
        while (parent) {
          reduced.push(parent);
          parent = reduced[reduced.length - 1].parent;
        }
      }
    }
    return reduced;
  };

const matchedRouteNameReducer =
  (requestedRouteName: string) =>
  (reduced: Route[], currentRoute: Route): Route[] => {
    if (reduced.length) {
      return reduced;
    }
    if (currentRoute.children?.length) {
      currentRoute.children?.reduce(
        matchedRouteNameReducer(requestedRouteName),
        reduced
      );
    } else {
      const matched = currentRoute.name === requestedRouteName;
      if (matched) {
        let parent = currentRoute.parent;
        reduced.push(currentRoute);
        while (parent) {
          reduced.push(parent);
          parent = reduced[reduced.length - 1].parent;
        }
      }
    }
    return reduced;
  };
