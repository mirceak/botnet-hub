import type {
  IHTMLElementComponent,
  TMainScope
} from '/remoteModules/frontend/engine/components/Main.js';
import type { LayoutScope as ILocalScope } from '/remoteModules/frontend/engine/router.js';

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

    async init(scope: ILocalScope) {
      await mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          async () => {
            if (!scope.scopesGetter) {
              throw new Error(
                'This layout component needs the nav, header and footer passed in through a local scope'
              );
            }

            const { _Nav } = await scope.scopesGetter(mainScope);
            const navComponent = await _Nav;
            const routerViewComponent = await _RouterView;
            return {
              /*language=HTML */
              template: `
                <header-main-component xInit>
                </header-main-component>
                <div class="layout--content">
                  <div class="row full-height full-width">
                    <${navComponent.componentName} xScope="xNavScope"
                                                   class="col">
                    </${navComponent.componentName}>
                    <${routerViewComponent.componentName} xScope="xRouterViewScope"
                                                          class="col">
                    </${routerViewComponent.componentName}>
                  </div>
                </div>
                <footer-main-component xInit>
                </footer-main-component>
              `,
              scopesGetter: () => ({
                xNavScope: navComponent.useComponent(),
                xRouterViewScope: routerViewComponent.useComponent()
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

  const instance = new mainScope.HTMLComponent(
    'layout-main-component',
    Component
  );
  return instance;
};

export default async (mainScope: TMainScope) => getComponent(mainScope);
