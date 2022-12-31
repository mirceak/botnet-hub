import type { IStore } from '@remoteModules/frontend/engine/store.js';
import type { Router } from '@remoteModules/frontend/engine/router.js';

export type HTMLComponent = InstanceType<typeof AHTMLComponent> &
  IHTMLComponent;

export type InstancedHTMLComponent = HTMLComponent &
  InstanceType<typeof window.HTMLElement>;

export type HTMLComponentModule = {
  default: (mainScope: IHTMLElementsScope) => unknown;
};

export interface IHTMLComponent {
  initComponent: (mainScope: IHTMLElementsScope) => void;
  useComponent: CallableFunction;
  componentName: string;
  useScopedCss?: (idIndex: number) => string;
  indexInParent: number;
}

export interface HTMLElementComponent
  extends InstanceType<typeof window.HTMLElement> {
  init: CallableFunction;
}

export interface IHTMLElementComponentStaticScope {
  componentName: string;
}

export interface IHTMLElementComponentTemplate {
  components: (
    | Promise<IHTMLElementComponentStaticScope>
    | IHTMLElementComponentStaticScope
    | undefined
  )[];

  target: InstanceType<typeof window.HTMLElement>;
}

export type IHTMLElementsScope = InstanceType<typeof HTMLElementsScope>;

export abstract class AHTMLComponent implements IHTMLComponent {
  scopedCssIdIndex = 0;
  indexInParent = -1;
  registerComponent(
    componentName: string,
    component: CustomElementConstructor,
  ) {
    window.customElements.define(componentName, component);
  }
  getScopedCss(css: string) {
    return css.replace(
      '<style staticScope',
      `<style staticScope=${this.scopedCssIdIndex++}`,
    );
  }
  public getComponentScope = <T>(componentName: string, _scope?: T) => {
    const scope = {
      ..._scope,
      componentName: componentName,
    };
    return scope as typeof scope & T;
  };

  abstract componentName: string;

  abstract initComponent(mainScope: IHTMLElementsScope): void;

  abstract useComponent(scope?: unknown): void;
}

class HTMLElementsScope {
  /*REQUIRED FOR SSR HYDRATION*/
  SSR = window.SSR;
  hydrating = window._shouldHydrate;
  hydrated = false;
  __modulesLoadedWithSSR = [] as Record<string, unknown>[];
  /*DO NOT REMOVE THESE LINES*/

  store!: IStore;
  router!: Router;

  HTMLComponent = AHTMLComponent;

  componentHydrationCallbacks = new Set();

  /*whatever async logic running in SSR must register through this method*/
  asyncHydrationCallback = async <T>(
    callback: () => Promise<T>,
    symbol = Symbol(),
  ) => {
    if (this.SSR || this.hydrating) {
      this.componentHydrationCallbacks.add(symbol);
    }

    await callback();

    if (this.SSR || this.hydrating) {
      this.componentHydrationCallbacks.delete(symbol);
      await this.asyncInstantiationConnectionFinishedCallback();
    }
  };

  /*we also need to wait for all components to get registered so that we know what modules we need to put in the __modulesLoadedWithSSR array*/
  asyncRegisterComponent = async <T extends HTMLComponentModule>(
    importer: () => Promise<T>,
  ) => {
    let component;
    await this.asyncHydrationCallback(async () => {
      component = (await (
        await this.loadModule(importer)
      ).default(this)) as HTMLComponent;
    });
    return component as ReturnType<T['default']>;
  };

  /*lazy loads components*/
  asyncLoadComponentTemplate = async (
    template: IHTMLElementComponentTemplate,
  ) => {
    const promises = [];
    for (let i = 0; i < template.components.length; i++) {
      if (template.components[i]) {
        const component = template.components[i];
        if (component) {
          promises.push(
            this.asyncHydrationCallback(async () => {
              const componentScope = await template.components[i];
              if (componentScope) {
                return await window.customElements
                  .whenDefined(componentScope.componentName)
                  .then(async () => {
                    if (!this.hydrating || this.SSR) {
                      return (
                        this.appendComponent(
                          template.target,
                          componentScope.componentName,
                          i,
                        ) as unknown as Record<
                          'init',
                          (scope: unknown) => Promise<void>
                        >
                      )?.init(componentScope);
                    }

                    return (
                      template.target.children[i] as unknown as Record<
                        'init',
                        (scope: unknown) => Promise<void>
                      >
                    )?.init(componentScope);
                  });
              }
            }),
          );
        }
      }
    }
    return Promise.all(promises);
  };

  appendComponent = (
    target: InstanceType<typeof window.HTMLElement>,
    tag: string,
    index: number,
  ): HTMLElement | undefined => {
    const componentConstructor = window.customElements.get(
      tag,
    ) as unknown as new () => HTMLComponent &
      InstanceType<typeof window.HTMLElement>;
    if (componentConstructor) {
      const component = new componentConstructor();
      component.indexInParent = index;

      let appendIndex = -1;
      [...(target.children as unknown as InstancedHTMLComponent[])].forEach(
        (child, _index) => {
          if (appendIndex < 0) {
            if (
              _index === index ||
              (child.indexInParent >= index && index >= _index)
            ) {
              appendIndex = _index;
            }
          }
        },
      );
      if (appendIndex < 0) {
        target.appendChild(component);
      } else {
        target.insertBefore(component, target.children[appendIndex]);
      }
      return component;
    }
    return undefined;
  };

  /*we need to keep track of imports for the __modulesLoadedWithSSR array used to provide all initial required javascript when serverside rendering*/
  loadModule = async <T>(importer: () => Promise<T>): Promise<T> => {
    let path = importer
      .toString()
      .match(/import\('.*'\)/g)?.[0]
      .replace("import('", '')
      .replace("')", '')
      .split('./')
      .pop() as string;
    if (path.includes('node_modules')) {
      path = '@' + path;
    } else if (!path.includes('@remoteModules/')) {
      path = '@remoteModules/' + path;
    }

    /*all files get imported form the same path, so we compute every path relative to this file*/
    const parsedPath = path
      .replace('@remoteModules/', '../../../remoteModules/../')
      .replace('@node_modules/', '../../../../node_modules/');
    let module;
    if (
      (module = this.__modulesLoadedWithSSR.find(
        (module) => module.path === parsedPath,
      ))
    ) {
      const encodedJs = encodeURIComponent(module.code as string);
      const dataUri = 'data:text/javascript;charset=utf-8,' + encodedJs;

      return await import(dataUri);
    }

    if (!this.SSR) {
      return await import(
        '/' +
          path.replace(
            '@node_modules/',
            '@remoteModules/../../../../node_modules/',
          )
      );
    } else {
      return await import(parsedPath);
    }
  };

  /*we need to know when we're done rendering on the server so asynchronous components and registry entries need to declare themselves as promises*/
  async asyncInstantiationConnectionFinishedCallback() {
    if (this.componentHydrationCallbacks.size === 0) {
      if (window.onHTMLReady) {
        /*used by SSR to signal everything loaded and page is rendered completely*/
        window.onHTMLReady();
      } else {
        this.hydrated = true;
        this.hydrating = false;
      }
    }
  }
}

export const initComponent = (mainScope: HTMLElementsScope) => {
  return class MainComponent extends window.HTMLElement {
    constructor() {
      super();

      this.init();
    }

    async init() {
      await mainScope.asyncHydrationCallback(async () => {
        await mainScope
          .loadModule(() => import('@remoteModules/frontend/engine/store.js'))
          .then(async ({ useStore }) => {
            mainScope.store = await useStore(mainScope);
          });

        await mainScope
          .loadModule(() => import('@remoteModules/frontend/engine/router.js'))
          .then(async ({ useRouter }) => {
            mainScope.router = await useRouter(mainScope);

            const [RouterView] = [
              mainScope
                .asyncRegisterComponent(
                  () =>
                    import(
                      '@remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
                    ),
                )
                .then((component) => {
                  if (window.SSR) {
                    component.routerViewRegister.clear();
                  }
                  return component;
                }),
            ];

            if (!mainScope.hydrating) {
              mainScope.asyncLoadComponentTemplate({
                target: this,
                components: [
                  RouterView.then((component) => component.useComponent()),
                ],
              });
            }
          });
      });
    }

    async disconnectedCallback() {
      await mainScope.router.onDestroy();
    }
  };
};

export const registerMainComponent = async () => {
  const mainScope = new HTMLElementsScope();
  window.customElements.define('main-component', initComponent(mainScope));
};

if (!window.SSR) {
  /*entrypoint*/
  await registerMainComponent();
} else {
  exports = {
    /*used for ssr*/
    registerMainComponent,
  };
}
