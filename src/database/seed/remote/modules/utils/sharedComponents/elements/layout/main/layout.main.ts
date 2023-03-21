import type {
  IHTMLElementComponent,
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

const getComponent = (mainScope: IMainScope) => {
  const { _RouterView } = {
    _RouterView: mainScope.asyncComponentScope(
      () =>
        import(
          '/remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
        )
    )
  };

  const scopedCss = fetch(
    '/remoteModules/utils/assets/scss/theme/main/theme.main.scss'
  ).then((response) => response.text());

  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
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
                    <${navComponentScope.componentName} wcScope="xNavScope"
                                                   class="col">
                    </${navComponentScope.componentName}>
                    <${routerViewComponentScope.componentName} wcScope="xRouterViewScope"
                                                          class="col">
                    </${routerViewComponentScope.componentName}>
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
    'layout-main-component',
    Component
  );

  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
