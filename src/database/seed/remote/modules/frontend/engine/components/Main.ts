import type { IStore } from '/remoteModules/frontend/engine/store.js';
import type { Router } from '/remoteModules/frontend/engine/router.js';

type EventListenerCallbackEvent<E> = E extends keyof GlobalEventHandlersEventMap
  ? GlobalEventHandlersEventMap[E]
  : E extends keyof WindowEventHandlersEventMap
  ? WindowEventHandlersEventMap[E]
  : undefined;

type RequiredFieldsOnly<T> = {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K];
};

export type HasRequired<Type> = RequiredFieldsOnly<Type> extends Record<
  string,
  never
>
  ? false
  : true;

export type UseComponentsParams<ILocalScope> =
  ILocalScope extends IComponentStaticScope
    ? [scope?: ILocalScope]
    : HasRequired<ILocalScope> extends false
    ? [scope?: ILocalScope]
    : [scope: ILocalScope];

type AsyncComponentScopeReturnType<ILocalScope> = ILocalScope extends undefined
  ? IComponentStaticScope
  : ILocalScope & IComponentStaticScope;

export type HTMLElementComponentStaticScope =
  | Promise<IComponentStaticScope>
  | IComponentStaticScope;

export type IMainScope = InstanceType<typeof HTMLElementsScope>;

export type IComponentComposedScope = IComponentStaticScope & object;

export interface IElementScope {
  attributes?: FilteredElementTypeProperties<HTMLElement>;
}

export interface IComponentExtendingElementScope<ElementType = HTMLElement>
  extends IElementScope {
  elementAttributes?: FilteredElementTypeProperties<ElementType>;
}

export interface IComponentStaticScope {
  componentTagName: string;
}

export interface IHTMLElementComponentStaticScope {
  template: string;
  scopesGetter?: () =>
    | Promise<Record<string, HTMLElementComponentStaticScope>>
    | Record<string, HTMLElementComponentStaticScope>;
}

export interface HTMLComponentModule<S = object> {
  default: (
    mainScope: HTMLElementsScope
  ) => Promise<BaseComponent<S>> | BaseComponent<S>;
}

export type HTMLComponent = InstanceType<
  typeof BaseComponent<IComponentStaticScope>
>;

export interface IHTMLComponent {
  getScope: (
    ...attrs: UseComponentsParams<never>
  ) => Promise<{ componentTagName: string }>;
}

export interface IHTMLElementComponent
  extends InstanceType<typeof window.HTMLElement> {
  initElement: (...attr: unknown[]) => Promise<void> | void;
  component: BaseElement;
}

export interface IElementComponent
  extends InstanceType<typeof window.HTMLElement> {
  component: BaseElement;
}

export interface IHTMLBaseElementComponent
  extends InstanceType<typeof window.HTMLElement> {
  component: BaseElement;
}

export interface IHTMLElementComponentTemplate {
  components: (
    | (() =>
        | (
            | IHTMLElementComponentStaticScope
            | NestedElement
            | HTMLElementComponentStaticScope
            | string
          )
        | Promise<
            | IHTMLElementComponentStaticScope
            | NestedElement
            | HTMLElementComponentStaticScope
            | string
          >)
    | Promise<
        | IHTMLElementComponentStaticScope
        | NestedElement
        | HTMLElementComponentStaticScope
        | string
      >
    | IHTMLElementComponentStaticScope
    | NestedElement
    | HTMLElementComponentStaticScope
    | string
  )[];

  target: InstanceType<typeof Element | typeof DocumentFragment>;
}

type AsyncAndPromise<T> =
  | T
  | Promise<T>
  | ((...attrs: never[]) => Promise<T> | T);

type NoExtraKeysError<
  Target,
  ComponentTag,
  ExtraKeys extends string & keyof Target = string & keyof Target
> = `Property '${ExtraKeys}' not in original scope of ${ComponentTag & string}`;

type ExcludeExtraKeys<Target, Scope> = {
  [K in Exclude<keyof Scope, keyof RequiredNested<Target>>]?: never;
};

type RequiredNested<K> = Required<K> & {
  [attr in keyof K]: K[attr] extends unknown
    ? RequiredNested<K[attr]>
    : K[attr];
};

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;

type Not<T extends boolean> = T extends true ? false : true;

type IsReadonly<O, P extends keyof O> = Not<
  Equals<{ [_ in P]: O[P] }, { -readonly [_ in P]: O[P] }>
>;

type OnlyEditableAttributes<K> = {
  [attr in keyof K as K[attr] extends string | number | boolean
    ? attr
    : never]: K[attr];
};

type OnlyWritableAttributes<K> = {
  [attr in keyof K as IsReadonly<K, attr> extends true ? never : attr]: K[attr];
};

type FilteredElementTypeProperties<ElementType> = Partial<
  OnlyWritableAttributes<OnlyEditableAttributes<ElementType>>
>;

type ValueOrFunction<K> = {
  [attr in keyof K]: K[attr] | (() => K[attr] | undefined);
};

type MakeScopeReactive<K> =
  | K
  | ({
      [attr in keyof K as attr extends 'attributes' | 'elementAttributes'
        ? attr
        : never]: AsyncAndPromise<ValueOrFunction<K[attr]>> | undefined;
    } & {
      [attr in keyof K as attr extends 'attributes' | 'elementAttributes'
        ? never
        : attr]: K[attr];
    });

export interface NestedElement {
  scopeGetter?: Promise<unknown> | unknown;
  scope: unknown;
  children?: AsyncAndPromise<AsyncAndPromise<NestedElement>[]>;
  element: Promise<HTMLElement>;
  tagName: string;
  isCustomElement: boolean;
}

abstract class BaseHtmlElement
  extends HTMLElement
  implements IElementComponent
{
  component: BaseElement;
  mainScope?: IMainScope;

  public constructor() {
    super();
    this.component = new BaseElement(this);
  }

  useInitElement(
    mainScope: IMainScope,
    callback: CallableFunction
  ): CallableFunction {
    this.mainScope = mainScope;
    return (scope?: unknown): void => {
      void this.component.initElement(
        mainScope,
        (scope as Record<'attributes', never>)?.attributes
      );
      return callback(scope);
    };
  }

  abstract initElement: ReturnType<typeof this.useInitElement>;
}

class BaseElement {
  target: HTMLElement;

  constructor(element: HTMLElement) {
    this.target = element;
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

class BaseComponent<ILocalScope = IComponentStaticScope>
  implements IHTMLComponent
{
  readonly componentTagName: string;

  private scopedCssIdIndex = 0;
  constructor(
    tagName: (() => string) | string,
    constructor: CustomElementConstructor,
    options?: ElementDefinitionOptions
  ) {
    this.componentTagName = typeof tagName === 'string' ? tagName : tagName();
    this.init(constructor, this, options);
  }

  public getScopedCss = (css: string) => {
    /* language=HTML */
    return `
      <style staticScope=${this.scopedCssIdIndex++}>${css}</style>
    `;
  };

  public getScope = async (...attrs: UseComponentsParams<ILocalScope>) => {
    return Object.assign(
      {
        componentTagName: this.componentTagName
      },
      attrs[0]
    );
  };

  private init(
    constructor: CustomElementConstructor,
    target: BaseComponent<ILocalScope>,
    options?: ElementDefinitionOptions
  ) {
    if (!window.customElements.get(target.componentTagName)) {
      window.customElements.define(
        target.componentTagName,
        constructor,
        options
      );
    }
  }
}

class HTMLElementsScope {
  store!: IStore;
  router!: Router;

  HTMLComponent = BaseComponent;
  HTMLElement = BaseHtmlElement;
  BaseElement = BaseElement;

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

  asyncComponent = async <S = object>(
    importer: () => Promise<HTMLComponentModule<S>>
  ) => {
    const module = await this.asyncStaticModule(importer);
    return module.default(this);
  };

  asyncComponentScopeGetter = async <S = object>(
    importer: () => Promise<HTMLComponentModule<S>>
  ) => {
    const module = await this.asyncComponent(importer);
    return module.getScope;
  };

  asyncComponentScope = async <S = object>(
    importer: () => Promise<HTMLComponentModule<S>>,
    ...attrs: UseComponentsParams<Omit<S, 'componentTagName'>>
  ): Promise<AsyncComponentScopeReturnType<S>> => {
    const getScope = await this.asyncComponentScopeGetter(importer);
    return (getScope as CallableFunction)(attrs[0]);
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

  useComponentsObject = async <
    Components = Record<string, () => Promise<HTMLComponentModule<never>>>
  >(
    components: Components
  ) => {
    const a = {} as {
      [key in keyof Components]: Awaited<
        ReturnType<
          Awaited<
            ReturnType<
              Components[key] extends () => Promise<
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                HTMLComponentModule<infer _Scope>
              >
                ? Components[key]
                : never
            >
          >['default']
        >
      >['getScope'];
    };

    for (const key in components) {
      a[key] = await this.asyncComponentScopeGetter(
        components[key] as () => Promise<HTMLComponentModule<unknown>>
      );
    }
    return this.useComponents(a);
  };

  useComponents = <Components>(components: Awaited<Components>) => {
    return {
      builder: <
        InferredScope extends Components[TagName & keyof Components] extends (
          ...args: [RequiredNested<infer _Scope>]
        ) => Promise<ComposedScope>
          ? _Scope
          : never,
        Scope extends InferredScope,
        ComposedScope extends InferredScope,
        Tag extends
          | `<${keyof Components & string}>`
          | `<${keyof Components & string}/>`
          | `<${keyof HTMLElementTagNameMap & string}>`
          | `<${keyof HTMLElementTagNameMap & string}/>`,
        Children,
        TagName = Tag extends `<${infer _TagName}>` | `<${infer _TagName}/>`
          ? _TagName
          : never,
        IsCustomComponent = TagName extends keyof Components ? true : false,
        IsClosedTag = Tag extends `<${string}/>` ? true : false,
        ScopeGetter = Components[TagName & keyof Components]
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
                | AsyncAndPromise<
                    TagName extends keyof HTMLElementTagNameMap
                      ? Partial<
                          ValueOrFunction<
                            OnlyWritableAttributes<
                              OnlyEditableAttributes<
                                HTMLElementTagNameMap[TagName]
                              >
                            >
                          >
                        >
                      : never
                  >
                | AsyncAndPromise<AsyncAndPromise<NestedElement>[]>,
              children?: AsyncAndPromise<AsyncAndPromise<NestedElement>[]>
            ]
          : HasRequired<InferredScope> extends true
          ? [
              tag: Tag,
              scope: IsCustomComponent extends true
                ? RequiredNested<InferredScope> extends Scope
                  ? AsyncAndPromise<MakeScopeReactive<Scope>>
                  : NoExtraKeysError<
                      ExcludeExtraKeys<InferredScope, Scope>,
                      Tag
                    >
                : AsyncAndPromise<
                    TagName extends keyof HTMLElementTagNameMap
                      ? Partial<
                          ValueOrFunction<
                            OnlyWritableAttributes<
                              OnlyEditableAttributes<
                                HTMLElementTagNameMap[TagName]
                              >
                            >
                          >
                        >
                      : never
                  >,
              children?: AsyncAndPromise<AsyncAndPromise<NestedElement>[]>
            ]
          : [
              tag: Tag,
              scope?:
                | (IsCustomComponent extends true
                    ? RequiredNested<InferredScope> extends Scope
                      ? AsyncAndPromise<MakeScopeReactive<Scope>>
                      : NoExtraKeysError<
                          ExcludeExtraKeys<InferredScope, Scope>,
                          Tag
                        >
                    : AsyncAndPromise<
                        TagName extends keyof HTMLElementTagNameMap
                          ? Partial<
                              ValueOrFunction<
                                OnlyWritableAttributes<
                                  OnlyEditableAttributes<
                                    HTMLElementTagNameMap[TagName]
                                  >
                                >
                              >
                            >
                          : never
                      >)
                | AsyncAndPromise<AsyncAndPromise<NestedElement>[]>,
              children?: AsyncAndPromise<AsyncAndPromise<NestedElement>[]>
            ]
      ) => {
        const [tagName, scope, children] = e as [
          Tag,
          AsyncAndPromise<Scope> | NestedElement[] | undefined,
          NestedElement[] | undefined
        ];
        const tag = tagName.replace(/^<|\/?>$/g, '') as keyof Components &
          string;
        const isCustomElement =
          Object.keys(components || {}).indexOf(tag) !== -1;
        let element: Promise<HTMLElement>;
        if (!isCustomElement) {
          const temp = document.createElement(tag);
          (temp as IHTMLBaseElementComponent).component = new BaseElement(temp);
          element = new Promise((resolve) => resolve(temp));
        } else {
          const constructor = window.customElements.get(tag);
          if (constructor) {
            element = new Promise((resolve) => resolve(new constructor()));
          } else {
            element = window.customElements
              .whenDefined(tag)
              .then((_constructor) => new _constructor());
          }
        }
        const scopeGetter = components[tag] as ScopeGetter;

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
            if ((await this.helpers).isAsyncFunction(component)) {
              component = await (
                component as () => Promise<IHTMLElementComponentStaticScope>
              )();
            }

            if (typeof component !== 'string') {
              const componentScope = await component;
              if (componentScope) {
                if ((componentScope as unknown as NestedElement).tagName) {
                  const nestedElement =
                    componentScope as unknown as NestedElement;
                  return (await this.appendComponent(
                    template.target,
                    nestedElement.tagName,
                    i,
                    false,
                    nestedElement
                  )) as IHTMLElementComponent;
                } else if (
                  (componentScope as IComponentStaticScope).componentTagName
                ) {
                  return await window.customElements
                    .whenDefined(
                      (componentScope as IComponentStaticScope).componentTagName
                    )
                    .then(async () => {
                      const comp = (await this.appendComponent(
                        template.target,
                        (componentScope as IComponentStaticScope)
                          .componentTagName,
                        i
                      )) as IHTMLElementComponent;
                      return comp.initElement(componentScope as never);
                    });
                } else if (
                  (componentScope as IHTMLElementComponentStaticScope).template
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
                        return +(child.getAttribute('wcY') as string) === i;
                      })
                      .forEach(this.parseChildren('wcScope', _scopes));
                  }
                }
              }
            } else {
              void this.appendComponent(
                template.target,
                component as string,
                i,
                true
              );
            }
          });
        }
      }
    }
  };

  appendComponent = async (
    target: IHTMLElementComponentTemplate['target'],
    tagOrTemplate: string,
    index: number,
    isTemplate = false,
    nestedEl?: NestedElement
  ): Promise<
    IHTMLElementComponent | HTMLElement[] | HTMLElement | undefined
  > => {
    if (isTemplate) {
      const result = [] as HTMLElement[];
      const temp = document.createElement('div');
      temp.setAttribute('style', 'display: none');
      temp.innerHTML += tagOrTemplate;
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
    } else {
      const componentConstructor = window.customElements.get(
        tagOrTemplate
      ) as CustomElementConstructor;
      if (componentConstructor && !nestedEl) {
        const component = new componentConstructor() as IHTMLElementComponent;
        component.setAttribute('wcY', index.toString());

        if (component) {
          const indexPosition = this.getIndexPositionInParent(
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
      } else if (nestedEl) {
        return (await this.oElementParser(
          target,
          nestedEl,
          index
        )) as HTMLElement;
      }
    }
    return undefined;
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
      | IHTMLElementComponent
      | IHTMLBaseElementComponent;

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
            if (child.scopeGetter) {
              child.scopeGetter = await child.scopeGetter;
            }
            if (this.helpers.isFunctionOrAsyncFunction(child.scopeGetter)) {
              child.scope = await (child.scopeGetter as CallableFunction)(
                await child.scope
              );
            } else {
              throw new Error('Scope getter should be a method');
            }
          }
          if (child.isCustomElement) {
            void (element as IHTMLElementComponent).initElement(child.scope);
          } else {
            void (element as IHTMLBaseElementComponent).component?.initElement(
              this,
              child.scope as Record<string, unknown>
            );
          }
        }
      }
    }

    return element as HTMLElement;
  };

  initiateComponentElement = async (
    scopeTag: 'wcScope' | 'dhvScope',
    child: IHTMLElementComponent,
    scopes: Record<string, HTMLElementComponentStaticScope>
  ) => {
    const scopeId = child.getAttribute(scopeTag);
    const forceInit = child.hasAttribute('wcInit');
    if (forceInit || (scopeId && Object.keys(scopes).indexOf(scopeId) !== -1)) {
      void this.asyncHydrationCallback(async () => {
        return window.customElements
          .whenDefined(child.tagName.toLowerCase())
          .then(async () => {
            if (scopeId) {
              const scope = await scopes?.[scopeId];
              if (scope) {
                if (scope.componentTagName === child.tagName.toLowerCase()) {
                  void child.initElement(scope as never);
                } else {
                  throw new Error(
                    `Scope "${scopeId}" has the wrong composable! Please use the composable from "${child.tagName.toLowerCase()}" class!`
                  );
                }
              }
            } else {
              void child.initElement();
            }
          });
      });
    }
  };

  parseChildren = (
    scopeTag: Parameters<typeof this.initiateComponentElement>[0],
    scopes?: Record<string, HTMLElementComponentStaticScope>
  ) => {
    return (child: IHTMLElementComponent): void => {
      if (
        (scopeTag === 'wcScope' ||
          child.tagName.toLowerCase() !== 'dynamic-html-view-component') &&
        scopes
      ) {
        void this.initiateComponentElement(scopeTag, child, scopes);
      }

      if (child.children.length) {
        return [
          ...(child.children as unknown as IHTMLElementComponent[])
        ].forEach(this.parseChildren(scopeTag, scopes));
      }
    };
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

            const _RouterView = mainScope.asyncComponentScope(
              () =>
                import(
                  '/remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
                )
            );

            mainScope.asyncLoadComponentTemplate({
              target: this,
              components: [_RouterView]
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
