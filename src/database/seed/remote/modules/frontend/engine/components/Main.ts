import type { IStore } from '/remoteModules/frontend/engine/store.js';
import type { Router } from '/remoteModules/frontend/engine/router.js';

export type IMainScope = InstanceType<typeof HTMLElementsScope>;

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

type Not<T extends boolean> = T extends true ? false : true;

type EventListenerCallbackEvent<E> = E extends keyof GlobalEventHandlersEventMap
  ? GlobalEventHandlersEventMap[E]
  : E extends keyof WindowEventHandlersEventMap
  ? WindowEventHandlersEventMap[E]
  : undefined;

type RequiredFieldsOnly<T> = {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K];
};

type HasRequired<Type> = object extends RequiredFieldsOnly<Type> ? false : true;

type RequiredNested<T> = T extends object
  ? {
      [P in keyof T]-?: RequiredNested<T[P]>;
    }
  : T;

type IsReadonly<O, P extends keyof O> = Not<
  Equals<{ [_ in P]: O[P] }, { -readonly [_ in P]: O[P] }>
>;

type AsyncAndPromise<T> = T | Promise<T> | (() => T | Promise<T>);

type UnwrapAsyncAndPromise<T> = T extends Promise<infer U>
  ? U
  : T extends () => Promise<infer U>
  ? U
  : T extends () => infer U
  ? U
  : T;

type UnwrapAsyncAndPromiseNested<T> = T extends AsyncAndPromise<infer _T>
  ? _T extends object
    ? {
        [P in keyof _T]: UnwrapAsyncAndPromiseNested<
          UnwrapAsyncAndPromise<_T[P]>
        >;
      }
    : UnwrapAsyncAndPromise<T>
  : UnwrapAsyncAndPromise<T>;

type ValueOrFunction<K> = K extends object
  ? {
      [attr in keyof K]: (() => K[attr]) | K[attr];
    }
  : K;

type OnlyEditableAttributes<K> = K extends object
  ? {
      [attr in keyof K as K[attr] extends string | number | boolean
        ? attr
        : never]: K[attr];
    }
  : K;

type OnlyWritableAttributes<K> = K extends object
  ? {
      [attr in keyof K as IsReadonly<K, attr> extends true
        ? never
        : attr]: K[attr];
    }
  : K;

type FilteredElementTypeProperties<ElementType> = ValueOrFunction<
  Partial<OnlyWritableAttributes<OnlyEditableAttributes<ElementType>>>
>;

export interface IComponentScope {
  attributes?: AsyncAndPromise<FilteredElementTypeProperties<HTMLElement>>;
}

export interface IComponentExtendingElementScope<
  ElementType extends HTMLElement = HTMLElement
> extends IComponentScope {
  elementAttributes?: AsyncAndPromise<
    FilteredElementTypeProperties<ElementType>
  >;
}

export interface IComponentStaticScope {
  tagName: string;
}

export interface IHTMLElementComponent<
  Scope extends IComponentStaticScope = IComponentStaticScope
> extends InstanceType<typeof window.HTMLElement> {
  initElement: (scope?: Scope) => Promise<void> | void;
}

interface HTMLComponentModule<S> {
  default: (
    mainScope: HTMLElementsScope
  ) => Promise<BaseComponent<S>> | BaseComponent<S>;
}

interface IHTMLComponent<S> {
  getScope: (scope?: S) => Promise<S & IComponentStaticScope>;
}

export interface IHTMLElementComponentTemplate {
  components: (
    | Promise<NestedElement | string>
    | (() => Promise<NestedElement | string> | (NestedElement | string))
    | NestedElement
    | string
  )[];

  target: InstanceType<typeof Element | typeof DocumentFragment>;
}

interface NestedElement {
  scopeGetter?: any;
  scope?: any;
  children?: AsyncAndPromise<AsyncAndPromise<NestedElement>[]>;
  element: Promise<HTMLElement>;
  tagName: string;
  isCustomElement: boolean;
}

class BaseHtmlElement<
  Target extends HTMLElement = HTMLElement
> extends window.HTMLElement {
  component: BaseElement<Target>;
  mainScope?: IMainScope;

  public constructor() {
    super();
    this.component = new BaseElement<Target>(this as unknown as Target);
  }

  useInitElement(mainScope: IMainScope, callback: CallableFunction) {
    this.mainScope = mainScope;
    return (scope?: unknown): void => {
      void this.component.initElement(
        mainScope,
        (scope as Record<'attributes', never>)?.attributes
      );
      return callback(scope);
    };
  }

  disconnectedCallback() {
    this.component.disconnectedCallback();
  }
}

class BaseElement<Target extends HTMLElement = HTMLElement> {
  target: Target;

  constructor(element: Target) {
    this.target = element;
  }

  disconnectedCallback() {
    /* todo: add generalist way to add event listeners for elements */
    // add listener removers here
  }

  async initElement(
    mainScope: IMainScope,
    scope?: Record<string, unknown>
  ): Promise<void> {
    if (mainScope.helpers.isFunctionOrAsyncFunction(scope)) {
      scope = await (scope as unknown as CallableFunction)();
    }

    const { staticObject, reactiveObject } = (scope &&
      Object.keys(scope).reduce(
        (reduced, key) => {
          if (mainScope.helpers.isFunction(scope?.[key])) {
            reduced.reactiveObject[key as keyof typeof scope] = scope?.[
              key as keyof typeof scope
            ] as CallableFunction;
          } else {
            reduced.staticObject[key as keyof typeof scope] =
              scope?.[key as keyof typeof scope];
          }
          return reduced;
        },
        { staticObject: {}, reactiveObject: {} } as {
          staticObject: Record<keyof typeof scope, unknown>;
          reactiveObject: Record<keyof typeof scope, CallableFunction>;
        }
      )) || { undefined };
    if (reactiveObject && Object.values(reactiveObject).length) {
      const render = () => {
        const reactiveResultsObject = Object.keys(reactiveObject).reduce(
          (reduced, key) => {
            reduced[key] = reactiveObject[key]();
            return reduced;
          },
          {} as Record<keyof typeof reactiveObject, unknown>
        );
        Object.assign(this.target, reactiveResultsObject);
      };
      mainScope.store.registerOnChangeCallback(
        [...Object.values(reactiveObject)],
        render
      );
      render();
    }
    Object.assign(this.target, staticObject);
  }
}

class BaseComponent<ILocalScope> implements IHTMLComponent<ILocalScope> {
  readonly tagName: string;

  private scopedCssIdIndex = 0;
  constructor(
    tagName: (() => string) | string,
    constructor: CustomElementConstructor,
    options?: ElementDefinitionOptions
  ) {
    this.tagName = typeof tagName === 'string' ? tagName : tagName();
    this.init(constructor, this, options);
  }

  public getScopedCss = (css: string) => {
    /* language=HTML */
    return `
      <style staticScope=${this.scopedCssIdIndex++}>${css}</style>
    `;
  };

  public getScope = async (scope?: ILocalScope) => {
    return Object.assign(
      {
        tagName: this.tagName
      },
      scope
    );
  };

  private init(
    constructor: CustomElementConstructor,
    target: BaseComponent<ILocalScope>,
    options?: ElementDefinitionOptions
  ) {
    if (!window.customElements.get(target.tagName)) {
      window.customElements.define(target.tagName, constructor, options);
    }
  }
}

class HTMLElementsScope {
  store!: IStore;
  router!: Router;

  BaseComponent = BaseComponent;
  BaseHtmlElement = BaseHtmlElement;

  preloadedRequests: Record<'code' | 'path', string | unknown>[] = [];

  asyncHydrationCallbackIndex = 0;

  helpers = this.asyncStaticModule(
    () => import('/remoteModules/utils/helpers/shared/utils.js')
  ) as unknown as Awaited<
    typeof import('/remoteModules/utils/helpers/shared/utils.js')
  >;

  registerEventListener = <
    T extends Element | Window,
    E extends
      | keyof GlobalEventHandlersEventMap
      | keyof WindowEventHandlersEventMap
  >(
    target: T,
    event: E,
    callback: (e: EventListenerCallbackEvent<E>) => void,
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

  asyncStaticModule<S>(importer: () => S, type = 'text/javascript') {
    const parsedPath = importer
      .toString()
      .match(/import\('.*'\)/g)?.[0]
      .replace("import('", '')
      .replace("')", '')
      .split('./')
      .pop() as string;

    for (const module of this.preloadedRequests) {
      if (module.path === parsedPath) {
        if (typeof module.code === 'string') {
          const blob = new Blob([module.code as string], {
            type
          });
          const url = URL.createObjectURL(blob);
          module.code = import(url) as unknown as typeof module.code;
          URL.revokeObjectURL(url);
          return module.code as S;
        } else {
          return module.code as S;
        }
      }
    }

    return import(parsedPath) as S;
  }

  async asyncStaticFile<Import>(importer: () => Import): Promise<string> {
    const parsedPath = importer
      .toString()
      .match(/import\('.*'\)/g)?.[0]
      .replace("import('", '')
      .replace("')", '')
      .split('./')
      .pop() as string;

    for (const module of this.preloadedRequests) {
      if (module.path === parsedPath) {
        return module.code as string;
      }
    }

    return fetch(parsedPath).then((res) => res.text());
  }

  asyncComponent = async <S = object | undefined>(
    importer: () => Promise<HTMLComponentModule<S>>
  ) => {
    const module = await this.asyncStaticModule(importer);
    return module.default(this);
  };

  asyncComponentScopeGetter = async <S = object | undefined>(
    importer: () => Promise<HTMLComponentModule<S>>
  ) => {
    const module = await this.asyncComponent(importer);
    return module.getScope;
  };

  asyncComponentScope = async <S = object | undefined>(
    importer: () => Promise<HTMLComponentModule<S>>,
    scope?: S
  ) => {
    const getScope = await this.asyncComponentScopeGetter(importer);
    return (getScope as CallableFunction)(scope);
  };

  /* we add blocking logic after everything finished loading and rendering */
  asyncHydrationCallback = async <T>(
    callback: () => Promise<T>
  ): Promise<void> => {
    if (this.asyncHydrationCallbackIndex !== -1) {
      this.asyncHydrationCallbackIndex++;
    } else {
      return void callback();
    }

    await callback();

    if (this.asyncHydrationCallbackIndex >= 0) {
      this.asyncHydrationCallbackIndex--;
      if (this.asyncHydrationCallbackIndex === 0) {
        this.asyncHydrationCallbackIndex = -1;
        this.addCssHelpers();
      }
    }
  };

  useComponentsObject = <
    Components =
      | Record<string, () => Promise<HTMLComponentModule<object>>>
      | undefined,
    Scope = Components extends
      | Record<string, () => Promise<HTMLComponentModule<infer _Scope>>>
      | undefined
      ? _Scope
      : object
  >(
    components?: Components
  ) => {
    const pulledComponents = {} as {
      [key in keyof Components]: Awaited<
        ReturnType<
          Awaited<
            ReturnType<
              Components[key] extends () => Promise<
                HTMLComponentModule<infer _Scope>
              >
                ? _Scope extends Scope
                  ? Components[key]
                  : never
                : never
            >
          >['default']
        >
      >['getScope'];
    };

    for (const key in components) {
      const newComponent = this.asyncComponentScopeGetter(
        components[key] as () => Promise<HTMLComponentModule<unknown>>
      );
      pulledComponents[key as keyof Components] =
        newComponent as unknown as Awaited<typeof newComponent>;
    }

    return this.useComponents(pulledComponents);
  };

  useComponents = <Components>(components: Components) => {
    return {
      builder: <
        InferredScope extends Components[TagName & keyof Components] extends (
          scope?: infer _Scope
        ) => Promise<unknown>
          ? _Scope
          : never,
        Scope extends InferredScope,
        ElementScope extends Partial<DefaultElementScope>,
        Tag extends
          | `<${keyof Components & string}>`
          | `<${keyof Components & string}/>`
          | `<${keyof HTMLElementTagNameMap & string}>`
          | `<${keyof HTMLElementTagNameMap & string}/>`,
        Children,
        TagName = Tag extends `<${infer _TagName}>` | `<${infer _TagName}/>`
          ? _TagName
          : never,
        DefaultElementScope = TagName extends keyof HTMLElementTagNameMap
          ? FilteredElementTypeProperties<HTMLElementTagNameMap[TagName]>
          : never,
        IsCustomComponent = TagName extends keyof Components ? true : false,
        IsClosedTag = Tag extends `<${string}/>` ? true : false
      >(
        ...e: IsClosedTag extends true
          ? [tag: Tag, children?: Children[]] extends [
              tag: Tag,
              children?: AsyncAndPromise<AsyncAndPromise<NestedElement>[]>
            ]
            ? [
                tag: Tag,
                children?: AsyncAndPromise<AsyncAndPromise<NestedElement>[]>
              ]
            : [
                tag: Tag,
                error?: "Error: Closing tag '/>' detected. This component will not initialize, so it can only receive a children's array!"
              ]
          : IsCustomComponent extends false
          ? [
              tag: Tag,
              scope?:
                | (TagName extends keyof HTMLElementTagNameMap
                    ? Required<
                        UnwrapAsyncAndPromiseNested<DefaultElementScope>
                      > &
                        RequiredNested<
                          UnwrapAsyncAndPromiseNested<DefaultElementScope>
                        > extends UnwrapAsyncAndPromiseNested<ElementScope>
                      ? AsyncAndPromise<ElementScope>
                      : never
                    : never)
                | AsyncAndPromise<AsyncAndPromise<NestedElement>[]>,
              children?: AsyncAndPromise<AsyncAndPromise<NestedElement>[]>
            ]
          : HasRequired<InferredScope> extends true
          ? [
              tag: Tag,
              scope: Required<UnwrapAsyncAndPromiseNested<InferredScope>> &
                RequiredNested<
                  UnwrapAsyncAndPromiseNested<InferredScope>
                > extends UnwrapAsyncAndPromiseNested<Scope>
                ? AsyncAndPromise<Scope>
                : `Error: No extra properties allowed!`,
              children?: AsyncAndPromise<NestedElement>[]
            ]
          : [
              tag: Tag,
              scope?: AsyncAndPromise<
                RequiredNested<
                  UnwrapAsyncAndPromiseNested<InferredScope>
                > extends object
                  ? Required<UnwrapAsyncAndPromiseNested<InferredScope>> &
                      RequiredNested<
                        UnwrapAsyncAndPromiseNested<InferredScope>
                      > extends UnwrapAsyncAndPromiseNested<Scope>
                    ? Scope
                    : `Error: No extra properties allowed!`
                  : AsyncAndPromise<NestedElement>[]
              >,
              children?: AsyncAndPromise<AsyncAndPromise<NestedElement>[]>
            ]
      ) => {
        const [tagName, scope, children] = e as [Tag, never, never];
        const tag = tagName.replace(/^<|\/?>$/g, '') as keyof Components &
          string;
        const constructor = window.customElements.get(tag);
        const isCustomElement =
          Object.keys(components || {}).indexOf(tag) !== -1 || !!constructor;
        let element: Promise<HTMLElement>;
        if (!isCustomElement) {
          const temp = document.createElement(tag);
          (temp as BaseHtmlElement).component = new BaseElement(temp);
          element = new Promise((resolve) => resolve(temp));
        } else {
          if (constructor) {
            element = new Promise((resolve) => resolve(new constructor()));
          } else {
            element = window.customElements
              .whenDefined(tag)
              .then((_constructor) => new _constructor());
          }
        }
        const scopeGetter = (components[tag] ||
          (() => scope)) as (typeof components)[typeof tag];

        return {
          scopeGetter,
          scope,
          element,
          children,
          isCustomElement,
          tagName
        };
      }
    };
  };

  /*lazy loads components*/
  asyncLoadComponentTemplate = (template: IHTMLElementComponentTemplate) => {
    for (let i = 0; i < template.components.length; i++) {
      if (template.components[i]) {
        let component = template.components[i];
        if (component) {
          void this.asyncHydrationCallback(async () => {
            component = await component;
            if (this.helpers.isFunctionOrAsyncFunction(component)) {
              component = await (component as CallableFunction)();
            }

            if (typeof component !== 'string') {
              const componentScope = await component;
              if (componentScope) {
                await this.oElementParser(
                  template.target,
                  componentScope as NestedElement,
                  i
                );
              }
            } else {
              await this.appendComponent(
                template.target,
                component as string,
                i
              );
            }
          });
        }
      }
    }
  };

  appendComponent = async (
    target: IHTMLElementComponentTemplate['target'],
    innerHtml: string,
    index: number
  ): Promise<HTMLElement[] | HTMLElement | undefined> => {
    const result = [] as HTMLElement[];
    const temp = document.createElement('div');
    temp.innerHTML += innerHtml;
    const children = [...(temp.children as unknown as HTMLElement[])];
    temp.remove();
    for (const child of children) {
      if (!child.getAttribute('wcY')) {
        child.setAttribute('wcY', index.toString());
        result.push(child);
        target.appendChild(child);
      }
    }
    result.forEach((child, _index) => {
      if (_index === 0) {
        target.children[
          this.getIndexPositionInParent(
            index,
            target.children as unknown as HTMLElement[]
          )
        ].insertAdjacentElement('beforebegin', child);
      } else {
        result[_index - 1].insertAdjacentElement('afterend', child);
      }
    });
    return result;
  };

  oElementParser = async (
    target: IHTMLElementComponentTemplate['target'],
    child: NestedElement,
    index: number
  ) => {
    if (this.helpers.isFunctionOrAsyncFunction(child)) {
      child = await (child as unknown as CallableFunction)();
    }

    const shouldInstantiate = !child.tagName.match(/^<(.*)\/>$/gis);
    const element = (await child.element) as
      | (BaseElement & HTMLElement)
      | BaseHtmlElement;

    if (element) {
      element.setAttribute('wcY', index.toString());
      const indexPosition = this.getIndexPositionInParent(
        index,
        target.children as unknown as HTMLElement[]
      );
      if (indexPosition < 0) {
        target.appendChild(element);
      } else {
        target.insertBefore(element, target.children[indexPosition]);
      }

      if (child) {
        if (
          (!child.children && this.helpers.isArray(child.scope)) ||
          child?.children
        ) {
          if (this.helpers.isFunctionOrAsyncFunction(child.children)) {
            child.children = await (child.children as CallableFunction)();
          }
          for (const [_index, _child] of (
            (child.children as []) || (child.scope as unknown as [])
          ).entries()) {
            void this.oElementParser(element, _child as NestedElement, _index);
          }
        }
        if (shouldInstantiate) {
          if (this.helpers.isFunctionOrAsyncFunction(child.scope)) {
            child.scope = await (child.scope as unknown as CallableFunction)();
          }
          if (child.scopeGetter) {
            if (
              this.helpers.isFunctionOrAsyncFunction(await child.scopeGetter)
            ) {
              child.scope = await (
                (await child.scopeGetter) as CallableFunction
              )(await child.scope);
            } else {
              throw new Error('Scope getter should be a method');
            }
          }
          if (child.isCustomElement) {
            void (element as BaseElement).initElement(child.scope);
          } else {
            void (element as BaseHtmlElement).component?.initElement(
              this,
              child.scope as Record<string, unknown>
            );
          }
        }
      }
    }

    return element as HTMLElement;
  };

  getIndexPositionInParent(index: number, children: HTMLElement[]): number {
    let maxIndexValue = 0;

    for (let i = 0; i < children.length; i++) {
      const attr = children[i].getAttribute('wcY') as string;
      if (+attr >= maxIndexValue) {
        if (index > +attr) {
          maxIndexValue = +attr;
        } else {
          return Math.max(0, i);
        }
      }
    }
    return -1;
  }

  addCssHelpers() {
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
                        ${cssString.replaceAll(
                          /--bp--/gs,
                          `-${screenSize}-min`
                        )}
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
    document.getElementById('main-component')?.removeAttribute('style');
  }

  applyBreakpoints(css: string): string {
    const strings = css.match(
      /(\/\* start_apply_breakpoints_tag \*\/)(.*)(\/\* end_apply_breakpoints_tag \*\/)/gs
    );
    strings &&
      strings.forEach((string) => {
        const noTagString = string
          .replace('/* startapply_breakpoints_tag */', '')
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
}

export const initComponent = (mainScope: HTMLElementsScope) => {
  return class MainComponent extends window.HTMLElement {
    constructor() {
      super();

      this.setAttribute('id', 'main-component');

      void this.init();
    }

    async init() {
      mainScope.helpers = await mainScope.helpers;

      await mainScope
        .asyncStaticModule(
          () => import('/remoteModules/frontend/engine/store.js')
        )
        .then(async ({ useStore }) => {
          mainScope.store = await useStore(mainScope);
        });

      return mainScope
        .asyncStaticModule(
          () => import('/remoteModules/frontend/engine/router.js')
        )
        .then(async ({ useRouter }) =>
          useRouter(mainScope).then(async (router) => {
            mainScope.router = router;
            mainScope.router.store = mainScope.store;

            const { builder: o } = mainScope.useComponentsObject({
              ['router-view-component']: () =>
                import(
                  '/remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
                )
            });

            mainScope.asyncLoadComponentTemplate({
              target: this,
              components: [o('<router-view-component>')]
            });
          })
        );
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
