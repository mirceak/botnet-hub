import type { IStore } from '@remoteModules/frontend/engine/store.js';
import type { Router } from '@remoteModules/frontend/engine/router.js';
import type { GenericFalsy } from '@remoteModules/utils/types/genericTypes.js';

export type HTMLElementComponentStaticScope =
  | Promise<IHTMLElementComponentStaticScope>
  | IHTMLElementComponentStaticScope
  | GenericFalsy;

export type HTMLComponent = InstanceType<typeof AHTMLComponent> &
  IHTMLComponent;

export type HTMLComponentModule = {
  default: (mainScope: IHTMLElementsScope) => unknown;
};

export type IHTMLElementsScope = InstanceType<typeof HTMLElementsScope>;

export interface IComponentAttributes {
  class?: string;
}

export interface IHTMLComponent {
  initComponent: (mainScope: IHTMLElementsScope) => void;
  useComponent: CallableFunction;
  componentName: string;
  useScopedCss?: (idIndex: number) => Promise<string> | string;
}

export interface IHTMLElementComponent
  extends InstanceType<typeof window.HTMLElement> {
  init: CallableFunction;
}

export interface IHTMLElementStaticScope {
  template: string;
  scopesGetter: () => Record<string, HTMLElementComponentStaticScope>;
}

export interface IHTMLElementComponentStaticScope {
  componentName: string;
}

export interface IHTMLElementComponentTemplate {
  components: (
    | HTMLElementComponentStaticScope
    | IHTMLElementStaticScope
    | string
  )[];

  target: InstanceType<typeof window.HTMLElement>;
}

export abstract class AHTMLComponent implements IHTMLComponent {
  scopedCssIdIndex = 0;
  registerComponent(
    componentName: string,
    component: CustomElementConstructor
  ) {
    window.customElements.define(componentName, component);
  }
  getScopedCss(css: string) {
    return `
      <style staticScope=${this.scopedCssIdIndex++}>${css}</style>
    `;
  }
  public getComponentScope = <T>(componentName: string, _scope?: T) => {
    const scope = {
      ..._scope,
      componentName: componentName
    };
    return scope as typeof scope & T;
  };

  abstract componentName: string;

  abstract initComponent(mainScope: IHTMLElementsScope): void;

  abstract useComponent(scope?: unknown): HTMLElementComponentStaticScope;
}

abstract class HTMLElement extends window.HTMLElement {
  protected constructor() {
    super();
  }
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

  HTMLElement = HTMLElement;

  registerEventListener = <T extends Element | Window, E extends Event>(
    target: T,
    event: Parameters<T['addEventListener']>[0],
    callback: (e: E) => void,
    options?: Parameters<T['addEventListener']>[2]
  ) => {
    target.addEventListener(
      event,
      callback as EventListenerOrEventListenerObject,
      options
    );
    return () =>
      target.removeEventListener(
        event,
        callback as EventListenerOrEventListenerObject
      );
  };

  getAttributesString = (scope?: { elementAttributes?: object }) => {
    if (scope?.elementAttributes) {
      return Object.keys(scope.elementAttributes).reduce((reduced, current) => {
        reduced += `${current}${
          '="' +
          (scope.elementAttributes?.[
            current as keyof typeof scope.elementAttributes
          ] || '')
        }" `;
        return reduced;
      }, '');
    }
    return '';
  };

  ind = 0;
  /*whatever async logic running in SSR must register through this method*/
  asyncHydrationCallback = async <T>(
    callback: () => Promise<T>,
    symbol = Symbol()
  ) => {
    if (this.SSR || this.hydrating) {
      this.componentHydrationCallbacks.add(symbol);
    }

    await callback();

    if (this.SSR || this.hydrating) {
      this.componentHydrationCallbacks.delete(symbol);
      this.asyncInstantiationConnectionFinishedCallback();
    }
  };

  /*we also need to wait for all components to get registered so that we know what modules we need to put in the __modulesLoadedWithSSR array*/
  asyncRegisterComponent = async <T extends HTMLComponentModule>(
    importer: () => Promise<T>
  ) => {
    let component;
    await this.asyncHydrationCallback(async () => {
      component = (await (
        await this.loadModule(importer)
      ).default(this)) as HTMLComponent;
    });
    return component as ReturnType<T['default']>;
  };

  parseChildren = (scopes: Record<string, HTMLElementComponentStaticScope>) => {
    return (child: IHTMLElementComponent): void => {
      if (child.tagName.toLowerCase() !== 'dynamic-html-view-component') {
        const scopeId = child.getAttribute('xScope');
        if (scopeId) {
          void this.asyncHydrationCallback(async () => {
            return window.customElements
              .whenDefined(child.tagName.toLowerCase())
              .then(async () => {
                const scope = (await scopes[
                  scopeId
                ]) as HTMLElementComponentStaticScope;

                if (scope) {
                  if (
                    (scope as IHTMLElementComponentStaticScope)
                      ?.componentName === child.tagName.toLowerCase()
                  ) {
                    child.init?.(scope);
                  } else {
                    throw new Error(
                      `Scope "${scopeId}" has the wrong composable! Please use the composable from "${child.tagName.toLowerCase()}" class!`
                    );
                  }
                }
              });
          });
        }

        if (child.children.length) {
          return [
            ...(child.children as unknown as IHTMLElementComponent[])
          ].forEach(this.parseChildren(scopes));
        }
      }
    };
  };

  /*lazy loads components*/
  asyncLoadComponentTemplate = async (
    template: IHTMLElementComponentTemplate
  ) => {
    const promises = [];
    for (let i = 0; i < template.components.length; i++) {
      if (template.components[i]) {
        const component = template.components[i];
        if (component) {
          if (typeof component !== 'string') {
            promises.push(
              this.asyncHydrationCallback(async () => {
                const componentScope = await component;
                if (componentScope) {
                  if (
                    (componentScope as IHTMLElementComponentStaticScope)
                      .componentName
                  ) {
                    return await window.customElements
                      .whenDefined(
                        (componentScope as IHTMLElementComponentStaticScope)
                          .componentName
                      )
                      .then(async () => {
                        if (!this.hydrating) {
                          return (
                            (await this.appendComponent(
                              template.target,
                              (
                                componentScope as IHTMLElementComponentStaticScope
                              ).componentName,
                              i
                            )) as unknown as Record<
                              'init',
                              (scope: unknown) => Promise<void>
                            >
                          )?.init(componentScope);
                        }

                        return (
                          template.target.children[
                            this.calculateElementPosition(
                              i,
                              template.target
                                .children as unknown as HTMLElement[]
                            )
                          ] as unknown as Record<
                            'init',
                            (scope: unknown) => Promise<void>
                          >
                        )?.init(componentScope);
                      });
                  } else if (
                    (componentScope as IHTMLElementStaticScope).template
                  ) {
                    const newElements = [] as Element[];
                    if (!this.hydrating) {
                      newElements.push(
                        ...((await this.appendComponent(
                          template.target,
                          (componentScope as IHTMLElementStaticScope).template,
                          i,
                          true
                        )) as HTMLElement[])
                      );
                    }

                    if (
                      (componentScope as IHTMLElementStaticScope).scopesGetter
                    ) {
                      const _scopes = (
                        componentScope as IHTMLElementStaticScope
                      ).scopesGetter();

                      [
                        ...(template.target
                          .children as unknown as IHTMLElementComponent[])
                      ]
                        .filter((child) => {
                          return (
                            +(child.getAttribute('indexInParent') as string) ===
                            i
                          );
                        })
                        .forEach(this.parseChildren(_scopes));
                    }
                  }
                }
                return;
              })
            );
          } else {
            if (!this.hydrating) {
              promises.push(
                this.asyncHydrationCallback(async () => {
                  await this.appendComponent(
                    template.target,
                    component,
                    i,
                    true
                  );
                })
              );
            }
          }
        }
      }
    }
    return Promise.all(promises);
  };

  private calculateElementPosition(
    index: number,
    children: HTMLElement[]
  ): number {
    let indexPosition = -1;
    let maxIndexValue = 0;

    while (indexPosition < children.length) {
      indexPosition++;

      if (indexPosition == children.length) {
        break;
      }

      if (
        +(children[indexPosition].getAttribute('indexInParent') as string) >=
        maxIndexValue
      ) {
        if (
          index >
          +(children[indexPosition].getAttribute('indexInParent') as string)
        ) {
          maxIndexValue = +(children[indexPosition].getAttribute(
            'indexInParent'
          ) as string);
        } else {
          break;
        }
      }
    }

    return Math.max(0, indexPosition);
  }

  appendComponent = async (
    target: InstanceType<typeof window.HTMLElement>,
    tagOrTemplate: string,
    index: number,
    isTemplate = false
  ): Promise<IHTMLElementComponent | HTMLElement[] | undefined> => {
    if (isTemplate) {
      const result = [] as HTMLElement[];
      target.innerHTML += tagOrTemplate;
      const children = [...(target.children as unknown as HTMLElement[])];
      for (const child of children) {
        if (!child.getAttribute('indexInParent')) {
          child.setAttribute('indexInParent', index.toString());
          result.push(child);
        }
      }
      result.forEach((child, _index) => {
        if (_index === 0) {
          target.children[
            this.calculateElementPosition(index, children)
          ].insertAdjacentElement('beforebegin', child);
        } else {
          result[_index - 1].insertAdjacentElement('afterend', child);
        }
      });
      return result;
    } else {
      const componentConstructor = window.customElements.get(
        tagOrTemplate
      ) as CustomElementConstructor;
      const component = new componentConstructor() as IHTMLElementComponent;
      component.setAttribute('indexInParent', index.toString());

      if (component) {
        const indexPosition = this.calculateElementPosition(
          index,
          target.children as unknown as HTMLElement[]
        );

        if (indexPosition < 0) {
          target.appendChild(component);
        } else {
          target.insertBefore(component, target.children[indexPosition]);
        }
        return component;
      }
    }
    return undefined;
  };

  /*we need to keep track of imports for the __modulesLoadedWithSSR array used to provide all initial required javascript when serverside rendering*/
  loadFile = async <T>(
    importer: () => Promise<T>
  ): Promise<Promise<string> | string> => {
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
    if (!this.SSR) {
      const fileData = this.__modulesLoadedWithSSR.find(
        (module) => module.path === path
      )?.code;
      if (fileData) {
        return fileData as unknown as string;
      }
      const parsedPath = '/@remoteModules/../../../../' + path;
      const result = await (await fetch(parsedPath)).text();
      this.__modulesLoadedWithSSR.push({
        path,
        code: result
      });
      return result;
    } else {
      return (await fetch(path)) as unknown as string;
    }
  };

  loadModule = <T>(importer: () => Promise<T>): Promise<T> => {
    //TODO: Remove after implementing database only development system
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
        (module) => module.path === parsedPath
      ))
    ) {
      const encodedJs = encodeURIComponent(module.code as string);
      const dataUri = 'data:text/javascript;charset=utf-8,' + encodedJs;

      return import(dataUri) as Promise<T>;
    }

    if (!this.SSR) {
      return import(
        '/' +
          path.replace(
            '@node_modules/',
            '@remoteModules/../../../../node_modules/'
          )
      ) as Promise<T>;
    } else {
      return import(parsedPath) as Promise<T>;
    }
  };

  /*we need to know when we're done rendering on the server so asynchronous components and registry entries need to declare themselves as promises*/
  asyncInstantiationConnectionFinishedCallback() {
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

      void this.init();
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
                    )
                )
                .then((component) => {
                  if (window.SSR) {
                    component.routerViewRegister.clear();
                  }
                  return component;
                })
            ];

            if (!mainScope.hydrating) {
              await mainScope.asyncLoadComponentTemplate({
                target: this,
                components: [
                  RouterView.then((component) => component.useComponent())
                ]
              });
            }

            if (!mainScope.SSR) {
              const css = document.createElement('style');
              const modifiers = ['padding', 'margin'];
              const directions = [
                'top',
                'bottom',
                'left',
                'right',
                'x',
                'y',
                'a'
              ];
              const sizes = [
                'auto',
                '0',
                '2px',
                '4px',
                '8px',
                '12px',
                '16px',
                '32px',
                '64px'
              ];
              const sizeVars = [
                '--auto',
                '--0',
                '--2px',
                '--4px',
                '--8px',
                '--12px',
                '--16px',
                '--32px',
                '--64px'
              ];

              css.innerHTML += ':root {';
              sizeVars.forEach((sizeVar, index) => {
                css.innerHTML += `
                ${sizeVar}: ${sizes[index]};
                `;
              });
              css.innerHTML += '}';

              const iterateDirections = (modifier: string): void => {
                directions.forEach((direction) => {
                  iterateVisibility(modifier, direction);
                });
              };

              const fillClass = (
                modifier: string,
                classDirection: string,
                directions: string[],
                size: string,
                sizeIndex: number
              ): string => {
                if (modifier === 'padding' && size === 'auto') {
                  return '';
                }

                let result = `
                .${modifier.substring(0, 1)}-${classDirection.substring(
                  0,
                  1
                )}-${size.replaceAll('px', '')} {`;

                directions.forEach((direction) => {
                  result += `${modifier}-${direction}: var(${sizeVars[sizeIndex]});`;
                });

                return result + '}';
              };

              const iterateVisibility = (
                modifier: string,
                direction: string
              ): void => {
                sizes.forEach((size, sizeIndex) => {
                  switch (direction) {
                    case 'x':
                      css.innerHTML += fillClass(
                        modifier,
                        direction,
                        ['left', 'right'],
                        size,
                        sizeIndex
                      );
                      break;
                    case 'y':
                      css.innerHTML += fillClass(
                        modifier,
                        direction,
                        ['top', 'bottom'],
                        size,
                        sizeIndex
                      );
                      break;
                    case 'a':
                      css.innerHTML += fillClass(
                        modifier,
                        direction,
                        ['left', 'right', 'top', 'bottom'],
                        size,
                        sizeIndex
                      );
                      break;
                    default:
                      css.innerHTML += fillClass(
                        modifier,
                        direction,
                        [direction],
                        size,
                        sizeIndex
                      );
                      break;
                  }
                });
              };

              modifiers.forEach((modifier) => {
                iterateDirections(modifier);
              });

              document.body.append(css);
            }
          });
      });
    }

    disconnectedCallback() {
      mainScope.router.onDestroy();
      mainScope.store.onDestroy();
    }
  };
};

export const registerMainComponent = () => {
  const mainScope = new HTMLElementsScope();
  window.customElements.define('main-component', initComponent(mainScope));
};

if (!window.SSR) {
  /*entrypoint*/
  registerMainComponent();
} else {
  exports = {
    /*used for ssr*/
    registerMainComponent
  };
}
