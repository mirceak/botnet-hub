import type { IStore } from '/remoteModules/frontend/engine/store.js';
import type { Router } from '/remoteModules/frontend/engine/router.js';

export type IMainScope = InstanceType<typeof MainScope>;

export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

export type Not<T extends boolean> = T extends true ? false : true;

export type ReplaceBoolean<T> = T extends object
  ? { [K in keyof T]: T[K] extends boolean ? boolean : ReplaceBoolean<T[K]> }
  : T;

export type EventListenerCallbackEvent<E> =
  E extends keyof GlobalEventHandlersEventMap
    ? GlobalEventHandlersEventMap[E]
    : E extends keyof WindowEventHandlersEventMap
    ? WindowEventHandlersEventMap[E]
    : never;

export type RequiredFieldsOnly<T> = {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: T[K];
};

export type HasRequired<Type> = object extends RequiredFieldsOnly<Type>
  ? false
  : true;

export type RequiredNested<T> = NonNullable<T> extends object
  ? {
      [P in keyof T]-?: RequiredNested<NonNullable<T[P]>>;
    }
  : NonNullable<T>;

export type IsReadonly<O, P extends keyof O> = Not<
  Equals<{ [_ in P]: O[P] }, { -readonly [_ in P]: O[P] }>
>;

export type AsyncAndPromise<T, A = unknown> =
  | T
  | Promise<T>
  | ((attr?: A) => T | Promise<T>);

export type UnwrapAsyncAndPromise<T> = T extends (
  attr: infer _A
) => infer R | Promise<infer R>
  ? R
  : T extends Promise<infer U>
  ? U
  : T;

export type UnwrapAsyncAndPromiseNested<T> = T extends (
  attr: infer _A
) => infer R | Promise<infer R>
  ? [R] extends [void]
    ? T
    : UnwrapAsyncAndPromiseNested<R>
  : T extends Promise<infer U>
  ? UnwrapAsyncAndPromiseNested<U>
  : T extends object
  ? { [K in keyof T]: UnwrapAsyncAndPromiseNested<T[K]> }
  : T;

export type ValueOrFunction<K> = K extends object
  ? {
      [attr in keyof K]: (() => K[attr]) | K[attr];
    }
  : K;

export type OnlyEditableAttributes<K> = K extends object
  ? {
      [attr in keyof K as K[attr] extends string | number | boolean
        ? attr
        : never]: K[attr];
    }
  : K;

export type OnlyWritableAttributes<K> = K extends object
  ? {
      [attr in keyof K as IsReadonly<K, attr> extends true
        ? never
        : attr]: K[attr];
    }
  : K;

export type FilteredElementTypeProperties<ElementType> = ValueOrFunction<
  Partial<OnlyWritableAttributes<OnlyEditableAttributes<ElementType>>>
>;

export interface IWCBaseScopeAttributesListeners<
  Element extends HTMLElement,
  E extends keyof GlobalEventHandlersEventMap = keyof GlobalEventHandlersEventMap
> {
  handlers?: Partial<
    Record<
      E,
      {
        callback: (e: EventListenerCallbackEvent<E>) => void;
        options?: Parameters<Element['addEventListener']>[2];
      }[]
    >
  >;
}

export interface IWCBaseRegisterScope<Scope> {
  useInitElement: (
    callback: HasRequired<Scope> extends true
      ? (scope: Scope) => Promise<void> | void
      : (scope: Scope) => Promise<void> | void
  ) => void;
  useOnDisconnectedCallback: (callback: CallableFunction) => void;
  asyncLoadComponentTemplate: <ElementType extends HTMLElement>(
    template: IWCTemplate<ElementType>
  ) => void;
  getScopedCss: (css: string) => string;
  el: HTMLElement;
}

export interface IWCBaseScope<ElementType extends HTMLElement> {
  attributes?: AsyncAndPromise<
    FilteredElementTypeProperties<ElementType> &
      IWCBaseScopeAttributesListeners<ElementType>,
    OElement<HTMLElement>
  >;
}

export interface IWCModule<S> {
  default: (mainScope: MainScope) => Promise<IWC<S>> | IWC<S>;
}

export interface IWC<S> {
  getScope: (scope?: S) => Promise<S & IWCStaticScope>;
}

export interface IWCStaticScope {
  readonly tagName: string;
}

export interface IWCTemplate<ElementType extends HTMLElement> {
  components: AsyncAndPromise<OElement<ElementType> | string>[];
  target?: HTMLElement;
}

export interface OElement<
  ElementType extends HTMLElement,
  Scope extends IWCBaseScope<ElementType> = IWCBaseScope<ElementType>
> {
  scopeGetter?: AsyncAndPromise<IWC<Scope>['getScope']>;
  scope?: Scope;
  children?: AsyncAndPromise<AsyncAndPromise<OElement<HTMLElement>>[]>;
  element: Promise<ElementType>;
  readonly tagName: string;
  readonly isCustomElement: boolean;
}

class MainScope {
  store!: IStore;
  router!: Router;

  helpers!: {
    validationsProto: Awaited<
      typeof import('/remoteModules/utils/helpers/shared/transformations/validations.proto.js')
    >;
    reducersFunctions: Awaited<
      ReturnType<
        Awaited<
          typeof import('/remoteModules/utils/helpers/shared/transformations/reducers.functions.js')
        >['default']
      >
    >;
  };

  elementRegister = new WeakMap<
    HTMLElement,
    {
      initElement: CallableFunction;
      disconnectedCallback: CallableFunction;
    }
  >();
  asyncHydrationCallbackIndex = 0;
  preloadedRequests: Record<'code' | 'path', string | Promise<unknown>>[] = [];

  readonly BaseElement = class BaseElement<ElementType extends HTMLElement> {
    public target: ElementType;
    mainScope: IMainScope;
    eventHandlerClosers: CallableFunction[] = [];
    reactiveValuesClosers: {
      props: CallableFunction[];
      callback: CallableFunction;
    }[] = [];

    constructor(mainScope: IMainScope, element: ElementType) {
      this.target = element;
      this.mainScope = mainScope;
    }

    disconnectedCallback = () => {
      this.eventHandlerClosers.forEach((currentEventHandlerCloser) => {
        currentEventHandlerCloser();
      });
      this.reactiveValuesClosers.forEach((currentEventHandlerCloser) => {
        this.mainScope.store.unRegisterOnChangeCallback(
          currentEventHandlerCloser.props,
          currentEventHandlerCloser.callback
        );
      });
      if (this.mainScope.elementRegister.has(this.target)) {
        this.mainScope.elementRegister.delete(this.target);
      }
    };

    initElement = async (
      oElement?: OElement<ElementType>,
      scope?: UnwrapAsyncAndPromiseNested<
        NonNullable<OElement<HTMLElement>['scope']>['attributes']
      >
    ): Promise<void> => {
      if (this.mainScope.helpers.validationsProto.isAsyncOrFunction(scope)) {
        scope =
          await this.mainScope.helpers.reducersFunctions.valueFromAsyncOrFunction(
            scope,
            [oElement]
          );
      }

      if (scope) {
        const { staticObject, reactiveObject } =
          Object.keys(scope).reduce(
            (reduced, key) => {
              if (scope && key !== 'handlers') {
                if (
                  this.mainScope.helpers.validationsProto.isAsyncOrFunction(
                    scope[key as never]
                  )
                ) {
                  reduced.reactiveObject[key as never] = scope[key as never];
                } else {
                  reduced.staticObject[key as never] = scope[key as never];
                }
              }
              return reduced;
            },
            { staticObject: {}, reactiveObject: {} } as {
              staticObject: Record<string, unknown>;
              reactiveObject: Record<string, CallableFunction>;
            }
          ) || undefined;
        if (reactiveObject) {
          for (const key in reactiveObject) {
            const render = () => {
              this.target[key as keyof typeof this.target] =
                reactiveObject[key]();
            };
            this.reactiveValuesClosers.push({
              props: [reactiveObject[key]],
              callback: render
            });
            this.mainScope.store.registerOnChangeCallback(
              [reactiveObject[key]],
              render
            );
            render();
          }
        }

        if (staticObject) {
          Object.assign(this.target, Object.assign(staticObject));
        }

        if (scope?.handlers) {
          Object.keys(scope.handlers).forEach((key) => {
            if (scope?.handlers) {
              const handlers =
                scope.handlers[key as keyof typeof scope.handlers];
              if (handlers && handlers.length) {
                handlers.forEach((currentHandler) => {
                  this.eventHandlerClosers.push(
                    this.mainScope.registerEventListener(
                      this.target,
                      key as keyof GlobalEventHandlersEventMap,
                      currentHandler.callback
                    )
                  );
                });
              }
            }
          });
        }
      }
    };
  };

  useComponentRegister = <Scope = IWCBaseScope<HTMLElement>>(
    tagName: string,
    setup: (options: IWCBaseRegisterScope<Scope>) => Promise<void> | void
  ) => {
    /* TODO: SECURITY! Must validate that the element was not already registered also must validate that the registering was done by this scope. Add constructors to an array and use that to avoid injecting scope into a component that was tampered with. Use-case one might load a component ahead of time and register it with a custom scope. */
    const mainScope = this;
    let scopedCssIdIndex = 0;

    const useComponentSetup = (target: HTMLElement) => {
      const component = new mainScope.BaseElement(this, target);

      let initElement: (
        oElement?: OElement<HTMLElement>,
        scope?: UnwrapAsyncAndPromiseNested<
          NonNullable<OElement<HTMLElement>>['scope']
        >
      ) => Promise<void>;
      let disconnectedCallback: CallableFunction;
      const useInitElement = (callback: CallableFunction) => {
        initElement = async (oElement, scope): Promise<void> => {
          void component.initElement(oElement, scope?.attributes);
          return callback(scope);
        };
      };
      const asyncLoadComponentTemplate = <ElementType extends HTMLElement>(
        template: IWCTemplate<ElementType>
      ) => {
        template.target = component.target;
        mainScope.asyncLoadComponentTemplate(
          template as Required<typeof template>
        );
      };
      const useOnDisconnectedCallback = (callback: CallableFunction) => {
        disconnectedCallback = () => {
          component.disconnectedCallback();
          callback();
        };
      };
      Promise.resolve(
        setup({
          useInitElement,
          asyncLoadComponentTemplate,
          useOnDisconnectedCallback,
          getScopedCss,
          el: component.target
        })
      ).then(() => {
        mainScope.elementRegister.set(component.target, {
          initElement,
          disconnectedCallback:
            disconnectedCallback || component.disconnectedCallback
        });
      });
    };

    const onDisconnectedCallback = (target: HTMLElement) => {
      if (mainScope.elementRegister.has(target)) {
        mainScope.elementRegister.get(target)?.disconnectedCallback();
      }
    };

    const elClass = class Element extends window.HTMLElement {
      constructor() {
        super();
        useComponentSetup(this as never);
      }

      disconnectedCallback() {
        onDisconnectedCallback(this);
      }
    };

    if (!window.customElements.get(tagName)) {
      window.customElements.define(tagName, elClass);
    }

    const getScope = async (scope?: Scope) => {
      return Object.assign(
        {
          tagName: tagName
        },
        scope
      );
    };

    const getScopedCss = (css: string) => {
      /* language=HTML */
      return `
        <style staticScope=${scopedCssIdIndex++}>${css}</style>
      `;
    };

    return {
      getScope
    };
  };

  registerEventListener = <
    T extends Element | Window,
    E extends
      | keyof GlobalEventHandlersEventMap
      | keyof WindowEventHandlersEventMap =
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

  asyncStaticModule = <ModuleImport, Module extends Promise<ModuleImport>>(
    importer: () => Module,
    type = 'text/javascript'
  ) => {
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
          module.code = import(url) as Module;
          URL.revokeObjectURL(url);
          return module.code as Module;
        } else {
          return module.code as Module;
        }
      }
    }

    return import(parsedPath) as Module;
  };

  async asyncStaticFile<ModuleImport, Module extends Promise<ModuleImport>>(
    importer: () => Module
  ): Promise<string> {
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

  asyncComponent = async <Scope>(importer: () => Promise<IWCModule<Scope>>) => {
    const module = await this.asyncStaticModule(importer);
    return module.default(this);
  };

  asyncComponentScopeGetter = async <Scope>(
    importer: () => Promise<IWCModule<Scope>>
  ) => {
    const module = await this.asyncComponent(importer);
    return module.getScope;
  };

  asyncComponentScope = async <Scope>(
    importer: () => Promise<IWCModule<Scope>>,
    scope?: Scope
  ) => {
    const getScope = await this.asyncComponentScopeGetter(importer);
    return (getScope as CallableFunction)(scope);
  };

  /* we add blocking logic after everything finished loading and rendering */
  asyncHydrationCallback = async (
    callback: () => Promise<void>
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
    Components = Record<string, <S>() => Promise<IWCModule<S>>> | undefined,
    Scope = Components extends
      | Record<string, () => Promise<IWCModule<infer _Scope>>>
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
              Components[key] extends () => Promise<IWCModule<infer _Scope>>
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
      const componentScopeGetter = this.asyncComponentScopeGetter(
        components[key] as <S>() => Promise<IWCModule<S>>
      );
      pulledComponents[key as keyof Components] =
        componentScopeGetter as unknown as Awaited<typeof componentScopeGetter>;
    }

    const { o } = this.useComponents(pulledComponents);

    return {
      components,
      o: o as typeof o & {
        [K in keyof typeof pulledComponents]: Parameters<
          (typeof pulledComponents)[K]
        >[0];
      },
      useComponentsObject: <
        _Components =
          | Record<string, () => Promise<IWCModule<object>>>
          | undefined
      >(
        _components?: _Components
      ) =>
        this.useComponentsObject({
          ..._components,
          ...components
        } as _Components & Components)
    };
  };

  useComponents = <Components>(components: Components) => {
    const o = <
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
        | `<${keyof Components & string}<>`
        | `<${keyof HTMLElementTagNameMap & string}>`
        | `<${keyof HTMLElementTagNameMap & string}/>`
        | `<${keyof HTMLElementTagNameMap & string}<>`,
      TagName = Tag extends
        | `<${infer _TagName}>`
        | `<${infer _TagName}/>`
        | `<${infer _TagName}<>`
        ? _TagName
        : never,
      DefaultElementScope = TagName extends keyof HTMLElementTagNameMap
        ? FilteredElementTypeProperties<HTMLElementTagNameMap[TagName]> &
            IWCBaseScopeAttributesListeners<HTMLElementTagNameMap[TagName]>
        : never,
      IsCustomComponent = TagName extends keyof Components ? true : false,
      IsClosedTag = Tag extends `<${string}/>` ? true : false
    >(
      ...e: IsClosedTag extends true
        ? [
            tag: Tag,
            children?: AsyncAndPromise<AsyncAndPromise<OElement<HTMLElement>>[]>
          ] extends [
            tag: Tag,
            children?: AsyncAndPromise<AsyncAndPromise<OElement<HTMLElement>>[]>
          ]
          ? [
              tag: Tag,
              children?: AsyncAndPromise<
                AsyncAndPromise<OElement<HTMLElement>>[]
              >
            ]
          : [
              tag: Tag,
              error?: "Error: Closing tag '/>' detected. This component will not initialize, so it can only receive a children's array!"
            ]
        : IsCustomComponent extends false
        ? [
            tag: Tag,
            scope?: UnwrapAsyncAndPromiseNested<ElementScope> extends object
              ? RequiredNested<
                  ReplaceBoolean<
                    UnwrapAsyncAndPromiseNested<DefaultElementScope>
                  >
                > extends UnwrapAsyncAndPromiseNested<
                  ReplaceBoolean<ElementScope>
                >
                ? AsyncAndPromise<
                    ElementScope,
                    OElement<
                      HTMLElementTagNameMap[TagName &
                        keyof HTMLElementTagNameMap]
                    >
                  >
                : `Error: No extra properties allowed! Please use 'satisfies (typeof o)['${TagName &
                    string}']' to properly validate the scope.`
              : AsyncAndPromise<AsyncAndPromise<OElement<HTMLElement>>[]>,
            children?: AsyncAndPromise<AsyncAndPromise<OElement<HTMLElement>>[]>
          ]
        : HasRequired<InferredScope> extends true
        ? [
            tag: Tag,
            scope: RequiredNested<
              ReplaceBoolean<UnwrapAsyncAndPromiseNested<InferredScope>>
            > extends UnwrapAsyncAndPromiseNested<ReplaceBoolean<Scope>>
              ? AsyncAndPromise<Scope, OElement<HTMLElement>>
              : `Error: No extra properties allowed! Please use 'satisfies (typeof o)['${TagName &
                  string}']' to properly validate the scope.`,
            children?: AsyncAndPromise<AsyncAndPromise<OElement<HTMLElement>>[]>
          ]
        : [
            tag: Tag,
            scope?: UnwrapAsyncAndPromiseNested<Scope> extends object
              ? RequiredNested<
                  ReplaceBoolean<UnwrapAsyncAndPromiseNested<InferredScope>>
                > extends ReplaceBoolean<UnwrapAsyncAndPromiseNested<Scope>>
                ? AsyncAndPromise<Scope, OElement<HTMLElement>>
                : `Error: No extra properties allowed! Please use 'satisfies (typeof o)['${TagName &
                    string}']' to properly validate the scope.`
              : AsyncAndPromise<AsyncAndPromise<OElement<HTMLElement>>[]>,
            children?: AsyncAndPromise<AsyncAndPromise<OElement<HTMLElement>>[]>
          ]
    ) => {
      const [tagName, scope, children] = e as [Tag, never, never];
      const tag = tagName.replace(/^<|\/|<?>$/g, '') as keyof Components &
        string;
      const constructor = window.customElements.get(tag);
      const isCustomElement =
        Object.keys(components || {}).indexOf(tag) !== -1 || !!constructor;
      let element: Promise<HTMLElement>;
      if (!isCustomElement) {
        const mainScope = this;

        if (!window.customElements.get(`${tag}-wc`)) {
          const tempEl = document.createElement(tag);
          tempEl.remove();

          const registerElement = <ElementType extends HTMLElement>(
            target: ElementType
          ) => {
            const baseElement = new mainScope.BaseElement<ElementType>(
              mainScope,
              target
            );
            mainScope.elementRegister.set(target, {
              initElement: baseElement.initElement,
              disconnectedCallback: baseElement.disconnectedCallback
            });
          };

          const disconnectedCallback = (target: HTMLElement) => {
            if (mainScope.elementRegister.has(target)) {
              mainScope.elementRegister.get(target)?.disconnectedCallback();
            }
          };

          window.customElements.define(
            `${tag}-wc`,
            class DomComponent extends (tempEl.constructor as CustomElementConstructor) {
              constructor() {
                super();
                registerElement(this);
              }

              disconnectedCallback() {
                disconnectedCallback(this);
              }
            },
            { extends: tag }
          );
        }

        const domElementConstructor = window.customElements.get(
          `${tag}-wc`
        ) as CustomElementConstructor;

        const temp = new domElementConstructor();

        element = new Promise((resolve) => resolve(temp));
      } else {
        if (constructor) {
          element = new Promise((resolve) => resolve(new constructor(this)));
        } else {
          element = window.customElements
            .whenDefined(tag)
            .then((_constructor) => new _constructor(this));
        }
      }

      const scopeGetter = components[tag] || (() => scope);

      return {
        scopeGetter,
        scope,
        element,
        children,
        isCustomElement,
        tagName
      };
    };

    return {
      o
    };
  };

  oElementParser = async <
    ElementType extends HTMLElement,
    Target extends HTMLElement
  >(
    target: Target,
    nestedElement: OElement<ElementType>,
    index: number
  ): Promise<ElementType | void> => {
    nestedElement = await nestedElement;

    if (this.helpers.validationsProto.isAsyncOrFunction(nestedElement)) {
      nestedElement =
        (await this.helpers.reducersFunctions.valueFromAsyncOrFunction(
          nestedElement
        )) as typeof nestedElement;
    }
    const shouldAddProps = !!nestedElement.tagName.match(/^<(.*)<>$/gis);
    const shouldInstantiate =
      !shouldAddProps && !nestedElement.tagName.match(/^<(.*)\/>$/gis);
    const element = await nestedElement.element;
    element.setAttribute('wcY', index.toString());
    const indexPosition = this.getIndexPositionInParent(
      index,
      target?.children
    );

    if (indexPosition < 0) {
      target?.appendChild(element);
    } else {
      target?.insertBefore(element, target.children[indexPosition]);
    }
    if (
      nestedElement.scope &&
      !nestedElement.children &&
      !this.helpers.validationsProto.isArray(nestedElement.scope)
    ) {
      if (
        this.helpers.validationsProto.isSyncFunction(nestedElement.scopeGetter)
      ) {
        nestedElement.scope =
          nestedElement.scopeGetter() as IWCBaseScope<ElementType>;
        if (
          this.helpers.validationsProto.isAsyncOrFunction(nestedElement.scope)
        ) {
          nestedElement.scope =
            await this.helpers.reducersFunctions.valueFromAsyncOrFunction(
              nestedElement.scope,
              [nestedElement]
            );
        }
      } else {
        if (
          this.helpers.validationsProto.isAsyncOrFunction(nestedElement.scope)
        ) {
          nestedElement.scope =
            await this.helpers.reducersFunctions.valueFromAsyncOrFunction(
              nestedElement.scope,
              [nestedElement]
            );
        }
        nestedElement.scope = await (
          await nestedElement.scopeGetter
        )?.(nestedElement.scope);
      }
    }

    if (
      !nestedElement.children &&
      this.helpers.validationsProto.isArray(nestedElement.scope)
    ) {
      nestedElement.children =
        nestedElement.scope as unknown as typeof nestedElement.children;
    }

    if (nestedElement.children) {
      if (
        nestedElement.children != nestedElement.scope &&
        this.helpers.validationsProto.isAsyncOrFunction(nestedElement.children)
      ) {
        nestedElement.children =
          await this.helpers.reducersFunctions.valueFromAsyncOrFunction(
            nestedElement.children,
            [nestedElement]
          );
      }

      if (nestedElement.children) {
        nestedElement.children = await Promise.all(
          (
            nestedElement.children as UnwrapAsyncAndPromise<
              UnwrapAsyncAndPromise<typeof nestedElement.children>
            >
          ).map(async (_child) => {
            _child = await _child;
            if (this.helpers.validationsProto.isAsyncOrFunction(_child)) {
              _child =
                await this.helpers.reducersFunctions.valueFromAsyncOrFunction(
                  _child,
                  [nestedElement]
                );
            }
            return _child;
          }, [])
        );
      }

      const hasChildren = nestedElement.children || nestedElement.scope;
      if (hasChildren) {
        for (const [_index, _child] of hasChildren.entries()) {
          void this.oElementParser<
            UnwrapAsyncAndPromise<
              UnwrapAsyncAndPromise<
                UnwrapAsyncAndPromise<Awaited<NonNullable<typeof _child>>>
              >['element']
            >,
            ElementType
          >(
            element,
            _child as unknown as UnwrapAsyncAndPromise<
              UnwrapAsyncAndPromise<
                UnwrapAsyncAndPromise<
                  (typeof nestedElement.children)[typeof _index]
                >
              >
            >,
            _index
          );
        }
      }
    }

    if (shouldAddProps || shouldInstantiate) {
      if (shouldAddProps && nestedElement.scope) {
        if (nestedElement.isCustomElement) {
          const nestedScope = nestedElement.scope as IWCBaseScope<ElementType>;
          if (
            this.helpers.validationsProto.isAsyncOrFunction(
              await nestedScope.attributes
            )
          ) {
            nestedScope.attributes =
              await this.helpers.reducersFunctions.valueFromAsyncOrFunction(
                nestedScope.attributes,
                [nestedElement]
              );
          }
          const nestedScopeUnwrapped = nestedElement.scope;

          if (nestedScopeUnwrapped.attributes) {
            const newAttributes = await Object.keys(
              nestedScopeUnwrapped.attributes
            ).reduce(async (reduced, key) => {
              const returned = await reduced;
              if (nestedScopeUnwrapped.attributes) {
                if (
                  this.helpers.validationsProto.isAsyncOrFunction(
                    nestedScopeUnwrapped.attributes?.[
                      key as keyof typeof nestedScopeUnwrapped.attributes
                    ]
                  )
                ) {
                  returned[key as keyof typeof returned] =
                    await this.helpers.reducersFunctions.valueFromAsyncOrFunction(
                      nestedScopeUnwrapped.attributes[
                        key as keyof typeof nestedScopeUnwrapped.attributes
                      ],
                      [nestedElement]
                    );
                } else {
                  returned[key as keyof typeof returned] =
                    await nestedScopeUnwrapped.attributes[
                      key as keyof typeof nestedScopeUnwrapped.attributes
                    ];
                }
              }
              return returned;
            }, Promise.resolve({} as typeof nestedScopeUnwrapped));

            Object.assign(element, newAttributes);
          }
        } else {
          const newScope = await Object.keys(nestedElement.scope).reduce(
            async (reduced, key) => {
              const returned = await reduced;
              if (
                this.helpers.validationsProto.isAsyncOrFunction(
                  nestedElement?.scope?.[
                    key as keyof typeof nestedElement.scope
                  ]
                )
              ) {
                returned[key as keyof typeof returned] =
                  (await this.helpers.reducersFunctions.valueFromAsyncOrFunction(
                    nestedElement?.scope?.[
                      key as keyof typeof nestedElement.scope
                    ],
                    [nestedElement]
                  )) as never;
              } else {
                returned[key as keyof typeof returned] = nestedElement?.scope?.[
                  key as keyof typeof nestedElement.scope
                ] as never;
              }
              return returned;
            },
            Promise.resolve(
              {} as UnwrapAsyncAndPromiseNested<typeof nestedElement.scope>
            )
          );

          Object.assign(element, newScope);
        }
      }

      if (shouldInstantiate) {
        void this.elementRegister
          .get(element)
          ?.initElement(nestedElement, nestedElement.scope);
      }
    }

    return element as ElementType;
  };

  /*lazy loads components*/
  asyncLoadComponentTemplate = <ElementType extends HTMLElement>(
    template: Required<IWCTemplate<ElementType>>
  ) => {
    for (let i = 0; i < template.components.length; i++) {
      if (template.components[i]) {
        let component = template.components[i];
        if (component) {
          void this.asyncHydrationCallback(async (): Promise<void> => {
            component = await component;
            if (this.helpers.validationsProto.isAsyncOrFunction(component)) {
              component = await (component as CallableFunction)();
            }

            if (typeof component !== 'string') {
              const componentScope = await component;
              if (componentScope) {
                await this.oElementParser<ElementType, typeof template.target>(
                  template.target as ElementType,
                  componentScope as OElement<ElementType>,
                  i
                );
              }
            } else {
              await this.appendComponent(
                template.target as ElementType,
                component as string,
                i
              );
            }
          });
        }
      }
    }
  };

  appendComponent = async <ElementType extends HTMLElement>(
    target: Required<IWCTemplate<ElementType>>['target'],
    innerHtml: string,
    index: number
  ): Promise<Element[] | Element | undefined> => {
    const result = [] as Element[];
    const temp = document.createElement('div');
    temp.innerHTML += innerHtml;
    const children = [...(temp.children as unknown as HTMLElement[])];
    temp.innerHTML = '';
    temp.remove();
    for (const child of children) {
      if (!child.getAttribute('wcY')) {
        child.setAttribute('wcY', index.toString());
        result.push(child);
        target?.appendChild(child);
      }
    }
    result.forEach((child, _index) => {
      if (_index === 0) {
        target?.children[
          this.getIndexPositionInParent(index, target?.children)
        ].insertAdjacentElement('beforebegin', child);
      } else {
        result[_index - 1].insertAdjacentElement('afterend', child);
      }
    });
    return result;
  };

  getIndexPositionInParent(index: number, children?: HTMLCollection): number {
    let maxIndexValue = 0;

    for (let i = 0; i < (children?.length || 0); i++) {
      const attr = children?.[i].getAttribute('wcY') as string;
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

export const initComponent = (mainScope: MainScope) => {
  return class MainComponent extends window.HTMLElement {
    constructor() {
      super();

      this.setAttribute('id', 'main-component');

      void this.init();
    }

    async init() {
      mainScope.helpers = {
        validationsProto: (await mainScope.asyncStaticModule(
          () =>
            import(
              '/remoteModules/utils/helpers/shared/transformations/validations.proto.js'
            )
        )) as unknown as Awaited<
          typeof import('/remoteModules/utils/helpers/shared/transformations/validations.proto.js')
        >,
        reducersFunctions: (await mainScope
          .asyncStaticModule(
            () =>
              import(
                '/remoteModules/utils/helpers/shared/transformations/reducers.functions.js'
              )
          )
          .then(({ default: getter }) =>
            getter(mainScope)
          )) as unknown as Awaited<
          ReturnType<
            Awaited<
              typeof import('/remoteModules/utils/helpers/shared/transformations/reducers.functions.js')
            >['default']
          >
        >
      };

      const ProxyObjectPromise = mainScope.asyncStaticModule(
        () => import('/remoteModules/utils/reactivity/objectProxy.js')
      );

      const pathToRegexpPromise = mainScope.asyncStaticModule(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        () => import('/node_modules/path-to-regexp/dist.es2015/index.js')
      );

      const storePromise = mainScope
        .asyncStaticModule(
          () => import('/remoteModules/frontend/engine/store.js')
        )
        .then(async ({ useStore }) => {
          mainScope.store = await useStore(
            mainScope.helpers,
            mainScope.asyncStaticModule,
            (
              await ProxyObjectPromise
            ).ProxyObject
          );
        });

      return mainScope
        .asyncStaticModule(
          () => import('/remoteModules/frontend/engine/router.js')
        )
        .then(async ({ useRouter }) => {
          return useRouter(mainScope).then(async ({ router, init }) => {
            mainScope.router = router;
            await storePromise;
            await init(pathToRegexpPromise);

            const { o } = mainScope.useComponentsObject({
              ['router-view-component']: () =>
                import(
                  '/remoteModules/frontend/engine/components/shared/dynamicViews/router/RouterView.js'
                )
            });

            mainScope.asyncLoadComponentTemplate({
              target: this,
              components: [o('<router-view-component>')]
            });
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
  const mainScope = new MainScope();
  window.customElements.define('main-component', initComponent(mainScope));
};

/*entrypoint*/
(() => {
  registerMainComponent();
})();
