import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const {
    _Button: { getScope: getScopeButton },
    _Input: { getScope: getScopeInput }
  } = {
    _Button: await mainScope.asyncComponent(() =>
      mainScope.asyncStaticModule(
        () =>
          import(
            '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
          )
      )
    ),
    _Input: await mainScope.asyncComponent(() =>
      mainScope.asyncStaticModule(
        () =>
          import(
            '/remoteModules/utils/sharedComponents/elements/form/inputs/element.form.input.js'
          )
      )
    )
  };

  const components = {
    ['button-component']: getScopeButton,
    ['input-component']: getScopeInput
  };

  type AsyncAndPromise<T> = T | Promise<T> | (() => Promise<T> | T);

  type NoExtraKeysError<
    Target,
    ComponentTag,
    ExtraKeys extends string & keyof Target = string & keyof Target
  > = `Property '${ExtraKeys}' not in original scope of ${ComponentTag &
    string}`;

  type ExcludeExtraKeys<Target, Scope> = {
    [K in Exclude<keyof Scope, keyof RequiredNested<Target>>]?: never;
  };

  type RequiredNested<K> = Required<K> & {
    [attr in keyof K]: K[attr] extends unknown
      ? RequiredNested<K[attr]>
      : K[attr];
  };

  const useComponents = <Components>(components: Components) => {
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
        TagName = Tag extends `<${infer _TagName}>` | `<${infer _TagName}/>`
          ? _TagName
          : never,
        IsCustomComponent = TagName extends keyof Components ? true : false,
        ScopeGetter = Components[TagName & keyof Components]
      >(
        tag: Tag,
        scope: IsCustomComponent extends true
          ? RequiredNested<InferredScope> extends Scope
            ? AsyncAndPromise<Scope>
            : NoExtraKeysError<ExcludeExtraKeys<InferredScope, Scope>, Tag>
          : AsyncAndPromise<
              Partial<
                HTMLElementTagNameMap[TagName & keyof HTMLElementTagNameMap]
              >
            >,
        children?: oElementReturn<unknown>[]
      ) => {
        const tagName = tag.replace(/^<|\/?>$/g, '') as Tag & keyof Components;
        const scopeGetter = components[tagName] as ScopeGetter;

        return {
          scopeGetter: scopeGetter,
          scope: scope as AsyncAndPromise<InferredScope>,
          children,
          tagName,
          nested: true
        };
      }
    };
  };

  interface oElementReturn<ScopeGetter> {
    scopeGetter: ScopeGetter;
    scope: ScopeGetter extends (...args: infer _Scope) => unknown
      ? AsyncAndPromise<_Scope>
      : unknown;
    children?: oElementReturn<unknown>[];
    tagName: string;
    nested: boolean;
  }

  const { builder: b } = useComponents<typeof components>(components);

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/frontend/modules/home/pages/page.About.scss')
  );

  class Element extends mainScope.HTMLElement {
    constructor() {
      super();
    }

    async initElement() {
      await mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          b('<div>', { className: 'card gap-8 m-t-16 fit-content' }, [
            b('<h1>', { innerText: 'About Page' }),
            b('<div>', { className: 'row full-width justify-center' }, [
              b('<button-component>', {
                label: 'Home',
                elementAttributes: { className: 'bg-primary p-x-16' },
                onClick() {
                  mainScope.router.push('home');
                }
              })
            ])
          ]),
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    }
  }

  const instance = new mainScope.HTMLComponent(
    tagName || 'about-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
