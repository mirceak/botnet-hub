import type { IComponent } from '@remoteModules/frontend/engine/components/Main.js';

export interface Route {
  path: string;
  component?: () => Promise<IComponent>;
  params?: Record<string, string[]>;
  children?: Route[];
}

export interface Router {
  ready?: true;
  routes: Route[];
  currentRoute?: Route;
}

const { pathToRegexp } = await import(
  '@remoteModules/utils/3rdParty/path-to-regexp/pathToRegexp.js'
);

const router: Router = {
  routes: [],
};

const PageHomeComponent = async () =>
  import('@remoteModules/frontend/modules/home/components/page.Home.js');
const Page404Component = async () =>
  import(
    '@remoteModules/frontend/modules/not-found/components/page.NotFound.js'
  );

export const useRoutes = async (): Promise<Route[]> => [
  {
    path: '/',
    component: PageHomeComponent,
  },
  {
    path: '/home',
    component: PageHomeComponent,
  },
  {
    path: '(.*)',
    component: Page404Component,
  },
];

export const useRouter = async (): Promise<Router> => {
  if (router.ready && !window.SSR) {
    return router;
  }

  router.routes.push(...(await useRoutes()));

  for (let i = 0, l = router.routes.length; i < l; i++) {
    const matched = pathToRegexp(router.routes[i].path).exec(
      window.SSR ? window.pathname : window.location.pathname,
    );
    if (matched) {
      router.currentRoute = router.routes[i];
      break;
    }
  }

  router.ready = true;
  return router;
};
