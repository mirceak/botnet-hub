import type { IStore } from '/remoteModules/frontend/engine/store.js';
import type { Router } from '/remoteModules/frontend/engine/router.js';
import type { GenericFalsy } from '/remoteModules/utils/types/genericTypes.js';

export type HTMLElementComponentStaticScope =
  | Promise<IComponentStaticScope>
  | IComponentStaticScope
  | GenericFalsy;

export type HTMLComponent = InstanceType<
  typeof BaseHTMLComponent<IComponentStaticScope>
>;

export interface HTMLComponentModule<S> {
  default: (
    mainScope: HTMLElementsScope
  ) => Promise<BaseHTMLComponent<S>> | BaseHTMLComponent<S>;
}

export type TMainScope = InstanceType<typeof HTMLElementsScope>;

export interface IComponentAttributes {
  class?: string;
}

export interface IHTMLComponent {
  useComponent: CallableFunction;
}

export interface IHTMLElementComponent
  extends InstanceType<typeof window.HTMLElement> {
  init: CallableFunction;
}

export interface IHTMLElementComponentStaticScope {
  template: string;
  scopesGetter?: () =>
    | Promise<Record<string, HTMLElementComponentStaticScope>>
    | Record<string, HTMLElementComponentStaticScope>;
}

export interface IComponentStaticScope {
  componentName: string;
}

export interface IComponentScope extends IComponentStaticScope {
  [x: string]: any;
}

export interface IHTMLElementComponentTemplate {
  components: (
    | HTMLElementComponentStaticScope
    | (() => Promise<IHTMLElementComponentStaticScope | string>)
    | IHTMLElementComponentStaticScope
    | string
  )[];

  target: InstanceType<typeof window.HTMLElement>;
}

export class BaseHTMLComponent<ILocalScope = IComponentStaticScope>
  implements IHTMLComponent
{
  scopedCssIdIndex = 0;
  private componentName: string;

  constructor(componentName: string, constructor: CustomElementConstructor) {
    this.componentName = componentName;
    this.initComponent(constructor, this);
  }

  registerComponent(
    component: CustomElementConstructor,
    target: BaseHTMLComponent<ILocalScope>
  ) {
    window.customElements.define(target.componentName, component);
  }

  getScopedCss(css: string) {
    return `
      <style staticScope=${this.scopedCssIdIndex++}>${css}</style>
    `;
  }

  public getComponentScope = (_scope: ILocalScope | undefined) => {
    const scope = {
      ...(_scope || {}),
      componentName: this.componentName
    };
    return scope as ILocalScope extends undefined
      ? typeof scope
      : typeof scope & ILocalScope;
  };

  public initComponent = (
    constructor: CustomElementConstructor,
    target: BaseHTMLComponent<ILocalScope>
  ) => {
    if (!window.customElements.get(target.componentName)) {
      this.registerComponent(constructor, target);
    }
  };

  public useComponent = async (...attrs: UseComponentsParams<ILocalScope>) => {
    return this.getComponentScope(attrs[0]);
  };
}
type RequiredFieldsOnly<T> = {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K];
};

type HasRequired<Type> = RequiredFieldsOnly<Type> extends Record<string, never>
  ? false
  : true;

type UseComponentsParams<ILocalScope> =
  ILocalScope extends IComponentStaticScope
    ? [scope?: ILocalScope]
    : HasRequired<ILocalScope> extends false
    ? [scope?: ILocalScope]
    : [scope: ILocalScope];

class HTMLElementsScope {
  store!: IStore;
  router!: Router;

  HTMLComponent = BaseHTMLComponent;
  HTMLElement = HTMLElement;

  asyncHydrationCallbackIndex = 0;

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

  /* we add blocking - NON-SSR logic after everything finished loading and rendering */
  asyncHydrationCallback = async <T>(callback: () => Promise<T>) => {
    if (this.asyncHydrationCallbackIndex !== -1) {
      this.asyncHydrationCallbackIndex++;
    }

    await callback();

    this.asyncHydrationCallbackIndex--;
    if (this.asyncHydrationCallbackIndex === 0) {
      this.asyncHydrationCallbackIndex = -1;
      this.addCssHelpers();
    }
  };

  addCssHelpers = () => {
    const screenSizes = ['599px', '1023px', '1439px', '1919px'];
    let css = '';
    const style = document.createElement('style');
    const modifiers = ['padding', 'margin'];
    const directions = ['top', 'bottom', 'left', 'right', 'x', 'y', 'a'];
    let cssString = '';
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
    const screens = ['xs', 'sm', 'md', 'lg', 'xl'];
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

    css += ':root {';
    sizeVars.forEach((sizeVar, index) => {
      css += `
                ${sizeVar}: ${sizes[index]};
                `;
    });
    screenSizes.forEach((sizeVar, index) => {
      css += `
                --${screens[index]}: ${sizeVar};
                `;
    });
    css += '}';

    const iterateDirections = (modifier: string, suffix?: string): void => {
      directions.forEach((direction) => {
        iterateVisibility(modifier, direction, suffix);
      });
    };

    const fillClass = (
      modifier: string,
      classDirection: string,
      directions: string[],
      size: string,
      sizeIndex: number,
      suffix?: string
    ): string => {
      if (modifier === 'padding' && size === 'auto') {
        return '';
      }

      let result = `
                .${modifier.substring(0, 1)}-${classDirection.substring(
        0,
        1
      )}-${size.replaceAll('px', '')}${suffix ? suffix : ''} {`;

      directions.forEach((direction) => {
        result += `${modifier}-${direction}: var(${sizeVars[sizeIndex]});`;
      });

      return result + '}';
    };

    const iterateVisibility = (
      modifier: string,
      direction: string,
      suffix?: string
    ): void => {
      sizes.forEach((size, sizeIndex) => {
        switch (direction) {
          case 'x':
            css += fillClass(
              modifier,
              direction,
              ['left', 'right'],
              size,
              sizeIndex,
              suffix
            );
            break;
          case 'y':
            css += fillClass(
              modifier,
              direction,
              ['top', 'bottom'],
              size,
              sizeIndex,
              suffix
            );
            break;
          case 'a':
            css += fillClass(
              modifier,
              direction,
              ['left', 'right', 'top', 'bottom'],
              size,
              sizeIndex,
              suffix
            );
            break;
          default:
            css += fillClass(
              modifier,
              direction,
              [direction],
              size,
              sizeIndex,
              suffix
            );
            break;
        }
      });
    };

    const addModifiers = (suffix?: string) => {
      modifiers.forEach((modifier) => {
        iterateDirections(modifier, suffix);
      });
    };
    addModifiers('--bp--');
    cssString = css;

    screens.forEach((screenSize, index) => {
      if (index === 0) {
        /* language=css */
        css += `
          @media (max-width: ${screenSizes[index]}) {
            ${cssString.replaceAll(/--bp--/gs, `-${screenSize}`)}
          }
        `;
      } else if (index < screens.length - 1) {
        /* language=css */
        css += `
          @media (max-width: ${screenSizes[index]}) {
            ${cssString.replaceAll(/--bp--/gs, `-${screenSize}`)}
          }
        `;

        /* language=css */
        css += `
          @media (min-width: ${screenSizes[index - 1]}) {
            ${cssString.replaceAll(/--bp--/gs, `-${screenSize}-min`)}
          }
        `;
      } else {
        /* language=css */
        css += `
          @media (min-width: ${screenSizes[index - 1]}) {
            ${cssString.replaceAll(/--bp--/gs, `-${screenSize}`)}
          }
        `;
      }
    });

    style.innerHTML = css.replaceAll(/--bp--/gs, '');
    document.body.append(style);
    document
      .getElementById('main-component')
      ?.setAttribute('style', 'display: inline;');
  };

  asyncRegisterComponent = async <S>(
    importer: Promise<HTMLComponentModule<S>>
  ): Promise<BaseHTMLComponent<S>> => {
    const module = (await importer) as HTMLComponentModule<S>;
    return module.default(this);
  };

  parseChildren = (
    scopes?: Record<string, HTMLElementComponentStaticScope>
  ) => {
    return (child: IHTMLElementComponent): void => {
      if (scopes) {
        const scopeId = child.getAttribute('xScope');
        const forceInit = child.hasAttribute('xInit');
        if (
          forceInit ||
          (scopeId && Object.keys(scopes).indexOf(scopeId) !== -1)
        ) {
          void this.asyncHydrationCallback(async () => {
            return window.customElements
              .whenDefined(child.tagName.toLowerCase())
              .then(async () => {
                if (scopeId) {
                  const scope = (await scopes?.[
                    scopeId
                  ]) as HTMLElementComponentStaticScope;
                  if (scope) {
                    if (
                      (scope as IComponentStaticScope)?.componentName ===
                      child.tagName.toLowerCase()
                    ) {
                      void child.init(scope);
                    } else {
                      throw new Error(
                        `Scope "${scopeId}" has the wrong composable! Please use the composable from "${child.tagName.toLowerCase()}" class!`
                      );
                    }
                  }
                } else {
                  void child.init?.();
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
    const promises: (() => Promise<void>)[] = [];
    for (let i = 0; i < template.components.length; i++) {
      if (template.components[i]) {
        let component = template.components[i];
        if (component) {
          promises.push(() =>
            this.asyncHydrationCallback(async () => {
              if (
                Object.prototype.toString.call(component) ===
                '[object AsyncFunction]'
              ) {
                component = await (
                  component as () => Promise<IHTMLElementComponentStaticScope>
                )();
              }
              if (typeof component !== 'string') {
                const componentScope = await component;
                if (componentScope) {
                  if ((componentScope as IComponentStaticScope).componentName) {
                    return await window.customElements
                      .whenDefined(
                        (componentScope as IComponentStaticScope).componentName
                      )
                      .then(async () => {
                        const comp = (await this.appendComponent(
                          template.target,
                          (componentScope as IComponentStaticScope)
                            .componentName,
                          i
                        )) as unknown as Record<
                          'init',
                          (scope: unknown) => Promise<void>
                        >;
                        return comp.init(componentScope);
                      });
                  } else if (
                    (componentScope as IHTMLElementComponentStaticScope)
                      .template
                  ) {
                    const newElements = [] as Element[];
                    newElements.push(
                      ...((await this.appendComponent(
                        template.target,
                        (componentScope as IHTMLElementComponentStaticScope)
                          .template,
                        i,
                        true
                      )) as HTMLElement[])
                    );
                    const _scopes = await (
                      componentScope as IHTMLElementComponentStaticScope
                    ).scopesGetter?.();
                    if (_scopes) {
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
              } else {
                await this.appendComponent(
                  template.target,
                  component as string,
                  i,
                  true
                );
              }
            })
          );
        }
      }
    }
    return promises.map((promise) => promise());
  };

  appendComponent = async (
    target: InstanceType<typeof window.HTMLElement>,
    tagOrTemplate: string,
    index: number,
    isTemplate = false
  ): Promise<IHTMLElementComponent | HTMLElement[] | undefined> => {
    if (isTemplate) {
      const result = [] as HTMLElement[];
      const temp = window.document.createElement('body');
      temp.innerHTML += tagOrTemplate;
      const children = [...(temp.children as unknown as HTMLElement[])];
      temp.remove();
      for (const child of children) {
        if (!child.getAttribute('indexInParent')) {
          child.setAttribute('indexInParent', index.toString());
          result.push(child);
          target.appendChild(child);
        }
      }
      result.forEach((child, _index) => {
        if (_index === 0) {
          target.children[
            this.calculateElementPosition(
              index,
              target.children as unknown as HTMLElement[]
            )
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

  applyBreakpoints(css: string): string {
    const strings = css.match(
      /(\/\* start_apply_breakpoints_tag \*\/)(.*)(\/\* end_apply_breakpoints_tag \*\/)/gs
    );
    strings &&
      strings.forEach((string) => {
        const noTagString = string
          .replace('/* start_apply_breakpoints_tag */', '')
          .replace('/* end_apply_breakpoints_tag */', '');

        let result = noTagString.replaceAll(/--bp--/gs, '');

        const screens = ['xs', 'sm', 'md', 'lg', 'xl'];
        const screenSizes = ['599px', '1023px', '1439px', '1919px'];

        screens.forEach((screenSize, index) => {
          if (index === 0) {
            result += `
                    @media (max-width: ${screenSizes[index]}) {
                  `;

            result += noTagString.replaceAll(/--bp--/gs, `-${screenSize}`);

            result += '}';
          } else if (index < screens.length - 1) {
            result += `
                    @media (max-width: ${screenSizes[index]}) {
                  `;

            result += noTagString.replaceAll(/--bp--/gs, `-${screenSize}`);

            result += '}';

            result += `
                    @media (min-width: ${screenSizes[index - 1]}) {
                  `;

            result += noTagString.replaceAll(/--bp--/gs, `-${screenSize}`);

            result += '}';
          } else {
            result += `
                    @media (min-width: ${screenSizes[index - 1]}) {
                  `;

            result += noTagString.replaceAll(/--bp--/gs, `-${screenSize}`);

            result += '}';
          }
        });

        css = css.replace(string, result);
      });
    return css;
  }

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
}

export const initComponent = (mainScope: HTMLElementsScope) => {
  return class MainComponent extends window.HTMLElement {
    constructor() {
      super();

      this.setAttribute('id', 'main-component');

      void this.init();
    }

    async init() {
      await mainScope.asyncHydrationCallback(async () => {
        await import('/remoteModules/frontend/engine/store.js').then(
          async ({ useStore }) => {
            mainScope.store = await useStore();
          }
        );

        return import('/remoteModules/frontend/engine/router.js').then(
          async ({ useRouter }) => {
            return useRouter(mainScope).then(async (router) => {
              mainScope.router = router;

              const _RouterView = mainScope.asyncRegisterComponent(
                import(
                  '/remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
                )
              );

              await mainScope.asyncLoadComponentTemplate({
                target: this,
                components: [
                  _RouterView.then(({ useComponent }) => useComponent())
                ]
              });
            });
          }
        );
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
/*entrypoint*/
registerMainComponent();
