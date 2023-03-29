import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const {
    _Button: { getScope }
  } = {
    _Button: await mainScope.asyncComponent(() =>
      mainScope.asyncStaticModule(
        () =>
          import(
            '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
          )
      )
    )
  };

  const components = {
    ['button-component']: getScope
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
        InferredScope extends Components[TagName] extends (
          ...args: [RequiredNested<infer _Scope>]
        ) => Promise<ComposedScope>
          ? _Scope
          : never,
        Scope extends InferredScope,
        ComposedScope extends InferredScope,
        Tag extends
          | `<${keyof Components & string}>`
          | `<${keyof Components & string}/>`,
        TagName extends keyof Components = Tag extends
          | `<${infer _TagName}>`
          | `<${infer _TagName}/>`
          ? _TagName & keyof Components
          : never,
        ScopeGetter = Components[TagName]
      >(
        tag: Tag,
        scope: RequiredNested<InferredScope> extends Scope
          ? AsyncAndPromise<Scope>
          : NoExtraKeysError<
              ExcludeExtraKeys<RequiredNested<InferredScope>, Scope>,
              Tag
            >,
        children?: oElementReturn<unknown>[]
      ) => {
        const tagName = tag.replace(/^<|\/?>$/g, '') as TagName;
        const scopeGetter = components[tagName] as (
          scope: Scope
        ) => Promise<ComposedScope>;

        return {
          scopeGetter: scopeGetter as ScopeGetter,
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
          b(
            '<button-component>',
            async () => ({
              label: '1',
              onClick() {
                mainScope.router.push('home');
              },
              elementAttributes: { class: 'bg-primary' }
            }),
            [
              b('<button-component>', async () => ({
                label: '2',
                onClick() {
                  mainScope.router.push('home');
                },
                elementAttributes: { class: 'bg-primary' }
              }))
            ]
          ),
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
