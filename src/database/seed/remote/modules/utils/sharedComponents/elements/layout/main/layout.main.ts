import type {
  IHTMLElementComponent,
  IHTMLElementsScope,
  HTMLComponent
} from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  _Header: Promise<HTMLComponent>;
  _Footer: Promise<HTMLComponent>;
  _Nav: Promise<HTMLComponent>;
}

const getComponents = (mainScope: IHTMLElementsScope) => ({
  _RouterView: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
      )
  )
});

const getClass = (
  mainScope: IHTMLElementsScope,
  instance: ReturnType<typeof getSingleton>
) => {
  const { _RouterView } = instance.registerComponents();

  return class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    constructor() {
      super();
    }

    init(scope: ILocalScope) {
      const { _Header, _Footer } = scope;

      void mainScope.asyncHydrationCallback(async () => {
        const navComponent = await scope?._Nav;
        const mainThemeCss = await instance.useScopedCss();
        const routerViewComponent = await _RouterView;

        return void mainScope.asyncLoadComponentTemplate({
          target: this,
          components: [
            _Header,
            {
              template: /* HTML */ `<div class="layout--content">
                  <div class="row full-height full-width">
                    <${navComponent.componentName} xScope="xNavScope" class="col"></${navComponent.componentName}>
                    <${routerViewComponent.componentName} xScope="xRouterViewScope" class="col"></${routerViewComponent.componentName}>
                  </div>       
                </div>
                ${mainThemeCss}`,
              scopesGetter: () => ({
                xNavScope: navComponent.useComponent(),
                xRouterViewScope: routerViewComponent.useComponent()
              })
            },
            _Footer
          ]
        });
      });
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'layout-main-component';

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope, this));
      } else if (window.SSR) {
        this.registerComponents();
      }
    };

    registerComponents = () => {
      return getComponents(mainScope);
    };

    useComponent = (scope?: ILocalScope) => {
      return this.getComponentScope(this.componentName, scope);
    };

    useScopedCss = async () => {
      const scssMainTheme = await mainScope.loadFile(
        () =>
          import('@remoteModules/utils/assets/scss/theme/main/theme.main.scss')
      );
      return this.getScopedCss(scssMainTheme.toString());
    };
  }

  return new Instance();
};

let componentInstance: ReturnType<typeof getSingleton>;

export default (mainScope: IHTMLElementsScope) => {
  if (!componentInstance || window.SSR) {
    if (!componentInstance) {
      componentInstance = getSingleton(mainScope);
    }
    componentInstance.initComponent(mainScope);
  }
  return componentInstance;
};
