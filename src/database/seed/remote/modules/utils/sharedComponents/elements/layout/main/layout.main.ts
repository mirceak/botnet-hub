import type {
  IComponentComposedScope,
  IElementScope,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IElementScope {
  scopesGetter: Promise<{
    _Header: Promise<IComponentComposedScope>;
    _Footer: Promise<IComponentComposedScope>;
    _Nav: Promise<IComponentComposedScope>;
  }>;
}

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject({
    ['router-view-component']: () =>
      import(
        '/remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/utils/assets/scss/theme/main/theme.main.scss')
  );

  class Element extends mainScope.HTMLElement {
    /* *Required here and not in the "LayoutScope" because we might want to have layouts without props */
    initElement = this.useInitElement(mainScope, async (scope: ILocalScope) => {
      const { _Nav } = await scope.scopesGetter;
      const navComponentScope = await _Nav;

      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          o('<header-main-component>' as never),
          o(
            '<div>',
            {
              className: 'layout--content'
            },
            [
              o(
                '<div>',
                {
                  className: 'row full-height full-width'
                },
                [
                  o(
                    navComponentScope.tagName as never,
                    navComponentScope as never
                  ),
                  o('<router-view-component>', {
                    attributes: {
                      className: 'col'
                    }
                  })
                ]
              )
            ]
          ),
          o('<footer-main-component>' as never),
          async () => {
            return instance.getScopedCss(
              mainScope.applyBreakpoints(await scopedCss)
            );
          }
        ]
      });
    });
  }

  const instance = new mainScope.HTMLComponent<ILocalScope>(
    tagName || 'layout-main-component',
    Element
  );

  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
