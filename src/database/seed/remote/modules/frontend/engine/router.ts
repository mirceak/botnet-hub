import type {
  IHTMLElementsScope,
  HTMLComponentModule,
} from '@remoteModules/frontend/engine/components/Main.js';

export interface Route {
  path: string;
  name?: string;
  redirect?: string;
  component?: () => unknown;
  params?: Record<string, string[]>;
  children?: Route[];
  parent?: Route;
  computedPath?: string;
  _symbol?: symbol;
}

export interface IRoute extends Route {
  component: <T extends HTMLComponentModule>() => Promise<T>;
}

export interface Router {
  ready?: true;
  routes: Route[];
  push: (name: string, fromBrowser?: boolean) => Promise<void>;
  redirect: (name: string) => Promise<void>;
  onPopState: (e: PopStateEvent) => void;
  onDestroy: () => Promise<void>;
  currentRoute?: Route;
  matchedRoutes?: Route[];
}

let pathToRegexp: typeof import('@node_modules/path-to-regexp/dist/index.js')['pathToRegexp'];

const getRouter = (mainScope: IHTMLElementsScope): Router => {
  return {
    routes: [] as Route[],
    async onPopState(e: PopStateEvent) {
      return this.push(e.state.name, true);
    },
    async onDestroy() {
      window.removeEventListener('popstate', this.onPopState.bind(this));
    },
    async push(name, replaceRoute = false) {
      const matched = this.routes.reduce(
        matchedRouteNameReducer(name),
        [] as Route[],
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
          ...matched,
        );
        this.currentRoute = matched[0];
        if (!mainScope.SSR) {
          if (!replaceRoute) {
            window.history.pushState(
              { name: matched[0].name, computedPath: matched[0].computedPath },
              '',
              (matched[0].computedPath as string) +
                (window.location.search || ''),
            );
          } else {
            window.history.replaceState(
              { name: matched[0].name, computedPath: matched[0].computedPath },
              '',
              (matched[0].computedPath as string) +
                (window.location.search || ''),
            );
          }
        } else {
          window.pathname =
            matched[0].computedPath + (window.pathname?.split('?')[1] || '');
        }

        /*Need to reset the stack of router-views*/
        /*Remove all router-views whose route is no longer matching and add the first one of those back and let it pull in its new component*/
        if (firstMatchingRouteIndex !== -1 && !mainScope.hydrating) {
          const firstRouterView = window.document.getElementById(
            `${firstMatchingRouteIndex}`,
          );
          const firstRouterViewParent = firstRouterView?.parentElement;
          if (firstRouterViewParent) {
            const firstRouterViewIndexInParent = Array.prototype.indexOf.call(
              firstRouterViewParent.children,
              firstRouterView,
            );
            oldMatchedRoutes?.forEach((_route, index) => {
              if (index >= firstMatchingRouteIndex)
                window.document.getElementById(`${index}`)?.remove();
            });
            await (
              mainScope.appendComponent(
                firstRouterViewParent,
                'router-view-component',
                firstRouterViewIndexInParent,
              ) as unknown as Record<'init', () => Promise<void>>
            ).init();
          }
        }
      } else {
        throw new Error(`Route "${name}" not found`);
      }
    },
    async redirect(name) {
      return this.push(name, true);
    },
  };
};

const components = {
  ProxyRouterViewComponent: (mainScope: IHTMLElementsScope) => async () =>
    mainScope.loadModule(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/dynamicViews/router/ProxyRouterView.js'
        ),
    ),
  LayoutMainComponent: (mainScope: IHTMLElementsScope) => async () =>
    mainScope.loadModule(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/elements/layouts/layout.main.js'
        ),
    ),
  PageHomeComponent: (mainScope: IHTMLElementsScope) => async () =>
    mainScope.loadModule(
      () => import('@remoteModules/frontend/modules/home/pages/page.Home.js'),
    ),
  PageAboutComponent: (mainScope: IHTMLElementsScope) => async () =>
    mainScope.loadModule(
      () => import('@remoteModules/frontend/modules/home/pages/page.About.js'),
    ),
  Page404Component: (mainScope: IHTMLElementsScope) => async () =>
    mainScope.loadModule(
      () =>
        import(
          '@remoteModules/frontend/modules/not-found/components/page.NotFound.js'
        ),
    ),
};

export const useRoutes = async (
  mainScope: IHTMLElementsScope,
): Promise<Route[]> => [
  {
    path: '/',
    name: 'root-home',
    redirect: 'home',
  },
  {
    path: '/home',
    component: components.LayoutMainComponent(mainScope),
    children: [
      {
        path: '',
        component: components.ProxyRouterViewComponent(mainScope),
        children: [
          {
            path: '',
            name: 'home',
            component: components.PageHomeComponent(mainScope),
          },
        ],
      },
      {
        path: 'about',
        name: 'about',
        component: components.PageAboutComponent(mainScope),
      },
    ],
  },
  {
    path: '(.*)',
    name: 'not-found',
    component: components.Page404Component(mainScope),
  },
];

export const useRouter = async (
  mainScope: IHTMLElementsScope,
): Promise<Router> => {
  const router = getRouter(mainScope);
  if (!pathToRegexp || mainScope.SSR) {
    /*TODO: Replace with own implementation of path interpreter*/
    pathToRegexp = (
      await (mainScope.SSR
        ? mainScope.loadModule(
            () => import('@node_modules/path-to-regexp/dist/index.js'),
          )
        : mainScope.loadModule(
            () => import('@node_modules/path-to-regexp/dist.es2015/index.js'),
          ))
    ).pathToRegexp;
  }

  router.routes.push(...(await useRoutes(mainScope)).map(routeMapper));

  window.addEventListener('popstate', router.onPopState.bind(router));

  router.matchedRoutes = router.routes.reduce(
    matchedRoutePathReducer(
      mainScope.SSR ? (window.pathname as string) : window.location.pathname,
    ),
    [] as Route[],
  );

  if (router.matchedRoutes.length) {
    router.currentRoute = router.matchedRoutes[0];
  } else {
    throw new Error('No route matched path');
  }

  if (router.currentRoute && router.currentRoute.redirect) {
    await router.redirect(router.currentRoute.redirect);
  }

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
              fullPath,
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
        reduced,
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
