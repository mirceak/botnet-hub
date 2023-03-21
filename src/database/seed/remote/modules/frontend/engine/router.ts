import type {
  IComponentStaticScope,
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

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
        generalReducer.bind({
          searchVal: name,
          condition: matchedRouteNameCondition
        }),
        [] as Route[]
      );

      if (matched?.length) {
        if (matched[0].redirect) {
          return this.redirect(matched[0].redirect);
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
            `rv-id-${firstMatchingRouteIndex}`
          );
          if (firstRouterView) {
            void (firstRouterView as IHTMLElementComponent)?.initElement();
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

export const useRouter = async (mainScope: IMainScope): Promise<Router> => {
  const router = getRouter();
  if (!pathToRegexp) {
    /*TODO: Replace with own implementation of path interpreter*/
    pathToRegexp = await mainScope
      .asyncStaticModule(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        () => import('/node_modules/path-to-regexp/dist.es2015/index.js')
      )
      .then((module) => module.pathToRegexp);
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

const generalReducer = function <
  Original extends Current[],
  Current extends {
    children?: Current[];
    parent?: Current;
  }
>(
  this: {
    condition: CallableFunction;
    searchVal: string;
    _any: Original;
  },
  reduced: Current[],
  current: Current
): Original | Current[] {
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
    pathToRegexp(currentRoute.computedPath as string).exec(searchVal) ||
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
    return mainScope.asyncComponentScope(() =>
      mainScope.asyncStaticModule(
        () =>
          import(
            '/remoteModules/utils/sharedComponents/dynamicViews/router/ProxyRouterView.js'
          )
      )
    );
  },
  LayoutMainComponent(mainScope: IMainScope) {
    return mainScope
      .asyncComponent(() =>
        mainScope.asyncStaticModule(
          () =>
            import(
              '/remoteModules/utils/sharedComponents/elements/layout/main/layout.main.js'
            )
        )
      )
      .then(({ getScope }) =>
        getScope({ scopesGetter: mainLayoutComponents(mainScope) })
      );
  },
  PageHomeComponent(mainScope: IMainScope) {
    return mainScope.asyncComponentScope(() =>
      mainScope.asyncStaticModule(
        () => import('/remoteModules/frontend/modules/home/pages/page.Home.js')
      )
    );
  },
  PageAuthComponent(mainScope: IMainScope) {
    return mainScope.asyncComponentScope(() =>
      mainScope.asyncStaticModule(
        () => import('/remoteModules/frontend/modules/auth/pages/page.Auth.js')
      )
    );
  },
  PageAboutComponent(mainScope: IMainScope) {
    return mainScope.asyncComponentScope(() =>
      mainScope.asyncStaticModule(
        () => import('/remoteModules/frontend/modules/home/pages/page.About.js')
      )
    );
  },
  PageComponentsComponent(mainScope: IMainScope) {
    return mainScope.asyncComponentScope(() =>
      mainScope.asyncStaticModule(
        () =>
          import(
            '/remoteModules/frontend/modules/home/pages/dev/page.Components.js'
          )
      )
    );
  },
  Page404Component(mainScope: IMainScope) {
    return mainScope.asyncComponentScope(() =>
      mainScope.asyncStaticModule(
        () =>
          import('/remoteModules/frontend/modules/not-found/page.NotFound.js')
      )
    );
  }
};

const mainLayoutComponents = async (mainScope: IMainScope) => ({
  _Header: mainScope.asyncComponentScope(() =>
    mainScope.asyncStaticModule(
      () =>
        import(
          '/remoteModules/utils/sharedComponents/elements/layout/main/header/header.main.js'
        )
    )
  ),
  _Footer: mainScope.asyncComponentScope(() =>
    mainScope.asyncStaticModule(
      () =>
        import(
          '/remoteModules/utils/sharedComponents/elements/layout/main/footer/footer.main.js'
        )
    )
  ),
  _Nav: mainScope.asyncComponentScope(() =>
    mainScope.asyncStaticModule(
      () =>
        import(
          '/remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.js'
        )
    )
  )
});
