import type {
  IComponentStaticScope,
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';
import type { IStore } from '/remoteModules/frontend/engine/store.js';

type Middleware = (
  router: Router,
  to?: Partial<Route>,
  from?: Partial<Route>,
  channel?: keyof NonNullable<Route['middleware']>
) => Promise<boolean> | boolean;

export interface Route {
  path: string;
  name?: string;
  params?: object;
  redirect?: string;
  component?: () => Promise<IComponentStaticScope>;
  middleware?: Record<'beforeEnter', Middleware[]>;
  children?: Route[];
  parent?: Route;
  computedPath?: string;
  _symbol?: symbol;
}

export interface Router {
  ready?: true;
  routes: Route[];
  store?: IStore;
  push: (route: Partial<Route>, replace?: boolean) => Promise<void>;
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
let compile: typeof import('path-to-regexp/dist/index.js')['compile'];
let match: typeof import('path-to-regexp/dist/index.js')['match'];

const getRouter = (): Router => {
  return {
    routes: [] as Route[],
    onPopState(e: IPopStateEvent) {
      return this.push(e.state, true);
    },
    onDestroy() {
      this.removePopstateListener?.();
    },
    async push(route, replaceRoute = false) {
      if (route.path && route.path !== '/') {
        route.path = route.path.replace(/^\//g, '');
      }

      const matched = this.routes.reduce(
        generalReducer.bind({
          searchVal: route.name || route.path,
          condition: route.name
            ? matchedRouteNameCondition
            : matchedRoutePathCondition
        }),
        [] as Route[]
      );

      const middlewareResults = await getMiddlewareResults(
        this,
        {
          from: this.currentRoute,
          to: route
        },
        matched,
        'beforeEnter'
      );

      if (!middlewareResults) {
        return;
      }

      if (!route.params && route.path) {
        const matchedRoute = match(
          (matched[0].computedPath as string).replace(/^\//g, ''),
          {
            decode: decodeURIComponent
          }
        )(route.path as string);
        if (matchedRoute) {
          route.params = matchedRoute.params;
        }
      }

      if (matched?.length) {
        if (matched[0].redirect) {
          return this.push({ name: matched[0].redirect }, true);
        }

        const reversedMatchedRoutes =
          this.matchedRoutes?.slice().reverse() || [];
        const firstMatchingRouteIndex = matched
          ?.slice()
          .reverse()
          .findIndex((currentRoute, index) => {
            return (
              currentRoute._symbol !== reversedMatchedRoutes[index]?._symbol
            );
          });
        this.currentRoute = matched[0];
        this.matchedRoutes?.splice(0, this.matchedRoutes.length, ...matched);

        const realComputedPath = compile(
          (matched[0].computedPath as string).replace(/^\//g, ''),
          {
            encode: encodeURIComponent
          }
        )(route.params);

        if (!replaceRoute) {
          window.history.pushState(
            {
              name: matched[0].name,
              params: route.params
            },
            '',
            `/${realComputedPath || ''}${window.location.search || ''}`
          );
        } else {
          window.history.replaceState(
            {
              name: matched[0].name,
              params: route.params
            },
            '',
            `/${realComputedPath || ''}${window.location.search || ''}`
          );
        }

        /*Need to reset the stack of router-views*/
        /*Remove all router-views whose route is no longer matching and add the first one of those back and let it pull in its new component*/
        if (firstMatchingRouteIndex !== -1) {
          const firstRouterView = window.document.getElementById(
            `rv-id-${firstMatchingRouteIndex}`
          );
          if (firstRouterView) {
            void (firstRouterView as IHTMLElementComponent)?.initElement();
          }
        }
      } else {
        throw new Error(`Route "${route.name}" not found`);
      }
    }
  };
};

const getMiddlewareResults = async (
  router: Router,
  routesOrigins: {
    to?: Partial<Route>;
    from?: Partial<Route>;
  },
  routes: Route[],
  type: keyof NonNullable<Route['middleware']>
) => {
  let currentRoute: Route | undefined = routes[0];
  let parent = currentRoute?.parent;
  let middleware = currentRoute?.middleware?.[type];
  let middlewareResult = await middleware?.reduce(
    async (reduced, currentMiddleware) => {
      return (
        (await reduced) === false ||
        (await currentMiddleware(
          router,
          routesOrigins.to,
          routesOrigins.from,
          type
        ))
      );
    },
    Promise.resolve(true)
  );

  if (middlewareResult === false) {
    return false;
  }

  while (parent) {
    currentRoute = currentRoute?.parent;
    parent = currentRoute?.parent;
    middleware = currentRoute?.middleware?.[type];
    middlewareResult = await middleware?.reduce(
      async (reduced, currentMiddleware) => {
        return (
          (await reduced) === false ||
          (await currentMiddleware(
            router,
            routesOrigins.to,
            routesOrigins.from,
            type
          ))
        );
      },
      Promise.resolve(true)
    );

    if (middlewareResult === false) {
      return false;
    }
  }

  return true;
};

export const useRouter = async (mainScope: IMainScope): Promise<Router> => {
  const router = getRouter();
  if (!pathToRegexp) {
    /*TODO: Replace with own implementation of path interpreter*/
    await mainScope
      .asyncStaticModule(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        () => import('/node_modules/path-to-regexp/dist.es2015/index.js')
      )
      .then((module) => {
        pathToRegexp = module.pathToRegexp;
        compile = module.compile;
        match = module.match;
      });
  }

  router.routes.push(...(useRoutes(mainScope) as Route[]).map(routeMapper));

  router.matchedRoutes = router.routes.reduce(
    generalReducer.bind({
      searchVal: window.location.pathname,
      condition: matchedRoutePathCondition
    }),
    [] as Route[]
  );

  if (router.matchedRoutes.length) {
    router.currentRoute = router.matchedRoutes[0];
  } else {
    throw new Error('No route matched path');
  }

  if (router.currentRoute && router.currentRoute.redirect) {
    await router.push({ ...router.currentRoute }, true);
  }

  if (
    await getMiddlewareResults(
      router,
      {
        from: undefined,
        to: { ...router.currentRoute }
      },
      router.matchedRoutes,
      'beforeEnter'
    )
  ) {
    const realComputedPath = match(
      (router.currentRoute.computedPath as string).replace(/^\//g, ''),
      {
        decode: decodeURIComponent
      }
    )(window.location.pathname.replace(/^\//g, ''));

    window.history.replaceState(
      {
        name: router.currentRoute.name,
        params: realComputedPath && realComputedPath.params
      },
      '',
      `/${(realComputedPath && realComputedPath.path) || ''}${
        window.location.search || ''
      }`
    );
  }

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

const generalReducer = function <
  Original extends Current,
  Current extends {
    children?: Original[];
    parent?: Original;
  }
>(
  this: {
    condition: CallableFunction;
    searchVal: string;
    forceTypePropagation: Original;
  },
  reduced: Current[],
  current: Current
): Current[] {
  if (reduced.length) {
    return reduced;
  }
  if (current.children?.length) {
    current.children.reduce(generalReducer.bind(this), reduced);
  } else {
    if (this.condition(current, this.searchVal)) {
      let parent = current.parent;
      reduced.push(current);
      while (parent) {
        reduced.push(parent);
        parent = reduced[reduced.length - 1].parent;
      }
    }
  }
  return reduced;
};

const matchedRoutePathCondition = (
  currentRoute: Route,
  searchVal: string
): boolean => {
  return !!(
    pathToRegexp(
      (currentRoute.computedPath as string).replace(/^\//g, '')
    ).exec(searchVal.replace(/^\//g, '')) ||
    (currentRoute.path === '' && currentRoute.parent
      ? pathToRegexp(currentRoute.parent.computedPath as string).exec(searchVal)
      : undefined)
  );
};

const matchedRouteNameCondition = (
  currentRoute: Route,
  searchVal: string
): boolean => {
  return currentRoute.name === searchVal;
};

export const useRoutes = (mainScope: IMainScope): Route[] => [
  {
    path: '/',
    name: 'root-home',
    redirect: 'home'
  },
  {
    path: '/home',
    component() {
      return LayoutMainComponent(mainScope);
    },
    middleware: {
      beforeEnter: [
        () => {
          return true;
        }
      ]
    },
    children: [
      {
        path: '',
        component() {
          return ProxyRouterViewComponent(mainScope);
        },
        children: [
          {
            path: '',
            name: 'home',
            component() {
              return PageHomeComponent(mainScope);
            }
          },
          {
            path: ':userId(\\d+)',
            name: 'homeUser',
            component() {
              return PageHomeComponent(mainScope);
            }
          }
        ]
      },
      {
        path: 'components',
        name: 'components',
        component() {
          return PageComponentsComponent(mainScope);
        }
      },
      {
        path: 'about',
        name: 'about',
        component() {
          return PageAboutComponent(mainScope);
        }
      }
    ]
  },
  {
    path: '/auth',
    name: 'auth',
    component() {
      return PageAuthComponent(mainScope);
    }
  },
  {
    path: '/not-found',
    name: '404',
    component() {
      return Page404Component(mainScope);
    }
  },
  {
    path: '(.*)',
    name: 'not-found',
    redirect: '404'
  }
];

const {
  ProxyRouterViewComponent,
  LayoutMainComponent,
  PageHomeComponent,
  PageAuthComponent,
  PageAboutComponent,
  PageComponentsComponent,
  Page404Component
} = {
  ProxyRouterViewComponent(mainScope: IMainScope) {
    return mainScope.asyncComponentScope(
      () =>
        import(
          '/remoteModules/frontend/engine/components/shared/dynamicViews/router/ProxyRouterView.js'
        )
    );
  },
  LayoutMainComponent(mainScope: IMainScope) {
    return mainScope
      .asyncComponent(
        () =>
          import(
            '/remoteModules/frontend/engine/components/shared/elements/layout/main/layout.main.js'
          )
      )
      .then(({ getScope }) =>
        getScope({ children: mainLayoutComponents(mainScope) })
      );
  },
  PageHomeComponent(mainScope: IMainScope) {
    return mainScope.asyncComponentScope(
      () => import('/remoteModules/frontend/modules/home/pages/page.Home.js')
    );
  },
  PageAuthComponent(mainScope: IMainScope) {
    return mainScope.asyncComponentScope(
      () => import('/remoteModules/frontend/modules/auth/pages/page.Auth.js')
    );
  },
  PageAboutComponent(mainScope: IMainScope) {
    return mainScope.asyncComponentScope(
      () => import('/remoteModules/frontend/modules/home/pages/page.About.js')
    );
  },
  PageComponentsComponent(mainScope: IMainScope) {
    return mainScope.asyncComponentScope(
      () =>
        import(
          '/remoteModules/frontend/modules/home/pages/dev/page.Components.js'
        )
    );
  },
  Page404Component(mainScope: IMainScope) {
    return mainScope.asyncComponentScope(
      () => import('/remoteModules/frontend/modules/not-found/page.NotFound.js')
    );
  }
};

const mainLayoutComponents = (mainScope: IMainScope) => ({
  _Header: mainScope.asyncComponentScope(
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/layout/main/header/header.main.js'
      )
  ),
  _Footer: mainScope.asyncComponentScope(
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/layout/main/footer/footer.main.js'
      )
  ),
  _Nav: mainScope
    .asyncComponentScope(
      () =>
        import(
          '/remoteModules/frontend/engine/components/shared/elements/layout/main/nav/left/nav.main.js'
        )
    )
    .then((scope) => {
      return {
        ...scope,
        attributes: {
          className: 'col'
        }
      };
    })
});
