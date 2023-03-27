import type {
  IComponentComposedScope,
  IComponentScope,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IComponentScope {
  scopesGetter: Promise<{
    _Header: Promise<IComponentComposedScope>;
    _Footer: Promise<IComponentComposedScope>;
    _Nav: Promise<IComponentComposedScope>;
  }>;
}

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { _RouterView } = {
    _RouterView: mainScope.asyncComponentScope(() =>
      mainScope.asyncStaticModule(
        () =>
          import(
            '/remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
          )
      )
    )
  };

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/utils/assets/scss/theme/main/theme.main.scss')
  );

  class Element extends mainScope.HTMLElement {
    constructor() {
      super();
    }

    /* *Required here and not in the "LayoutScope" because we might want to have layouts without props */
    async initElement(scope: Required<ILocalScope>) {
      await mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          async () => {
            const { _Nav } = await scope.scopesGetter;
            const navComponentScope = await _Nav;
            const routerViewComponentScope = await _RouterView;
            return {
              /* language=HTML */
              template: `
                <header-main-component wcInit>
                </header-main-component>
                <div class="layout--content">
                  <div class="row full-height full-width">
                    <${navComponentScope.componentTagName} wcScope="xNavScope"
                                                        class="col">
                    </${navComponentScope.componentTagName}>
                    <${routerViewComponentScope.componentTagName} wcScope="xRouterViewScope"
                                                               class="col">
                    </${routerViewComponentScope.componentTagName}>
                  </div>
                </div>
                <footer-main-component wcInit>
                </footer-main-component>
              `,
              scopesGetter() {
                return {
                  xNavScope: navComponentScope,
                  xRouterViewScope: routerViewComponentScope
                };
              }
            };
          },
          async () => {
            return instance.getScopedCss(
              mainScope.applyBreakpoints(await scopedCss)
            );
          }
        ]
      });
    }
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
