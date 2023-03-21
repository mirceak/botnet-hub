import type {
  IHTMLElementComponent,
  TMainScope
} from '/remoteModules/frontend/engine/components/Main.js';
import { IComponentScope } from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  scopesGetter: Promise<{
    _Header: Promise<IComponentScope>;
    _Footer: Promise<IComponentScope>;
    _Nav: Promise<IComponentScope>;
  }>;
}

const getComponent = async (mainScope: TMainScope) => {
  const { _RouterView } = {
    _RouterView: mainScope.asyncRegisterComponent(
      import(
        '/remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
      )
    )
  };

  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    constructor() {
      super();
    }

    /* *Required here and not in the "LayoutScope" because we might want to have layouts without props */
    async init(scope: Required<ILocalScope>) {
      await mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          async () => {
            const { _Nav } = await scope.scopesGetter;
            const navComponent = await _Nav;
            const navComponentScope = await navComponent.useComponent();
            const routerViewComponent = await _RouterView;
            const routerViewComponentScope =
              await routerViewComponent.useComponent();
            return {
              /*language=HTML */
              template: `
                <header-main-component xInit>
                </header-main-component>
                <div class="layout--content">
                  <div class="row full-height full-width">
                    <${navComponentScope.componentName} xScope="xNavScope"
                                                   class="col">
                    </${navComponentScope.componentName}>
                    <${routerViewComponentScope.componentName} xScope="xRouterViewScope"
                                                          class="col">
                    </${routerViewComponentScope.componentName}>
                  </div>
                </div>
                <footer-main-component xInit>
                </footer-main-component>
              `,
              scopesGetter: () => ({
                xNavScope: navComponentScope,
                xRouterViewScope: routerViewComponentScope
              })
            };
          },
          async () => {
            const scopedCss = await (
              await fetch(
                '/remoteModules/utils/assets/scss/theme/main/theme.main.scss'
              )
            ).text();
            return instance.getScopedCss(mainScope.applyBreakpoints(scopedCss));
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

export default async (mainScope: TMainScope) => getComponent(mainScope);
