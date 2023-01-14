import type {
  InstancedHTMLComponent,
  IHTMLElementsScope,
  HTMLComponent
} from '@remoteModules/frontend/engine/components/Main.js';

interface ILocalScope {
  _Header: Promise<HTMLComponent>;
  _Footer: Promise<HTMLComponent>;
  _Nav: Promise<HTMLComponent>;
}

const getComponents = (mainScope: IHTMLElementsScope) => ({
  _DynamicHtmlView: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
      )
  ),
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
  const { _DynamicHtmlView, _RouterView } = instance.registerComponents();

  return class Component
    extends mainScope.HTMLElement
    implements InstancedHTMLComponent
  {
    constructor() {
      super();
    }

    init(scope: ILocalScope) {
      const { _Header, _Footer } = scope;
      void mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          _Header,
          _DynamicHtmlView.then(async ({ useComponent }) => {
            const navComponent = await scope?._Nav;
            const routerViewComponent = await _RouterView;
            let template = `<${routerViewComponent.componentName} x-scope="xRouterViewScope"></${routerViewComponent.componentName}>`;
            if (navComponent) {
              template =
                `<${navComponent.componentName} x-scope="xNavScope"></${navComponent.componentName}>` +
                template;
            }
            return useComponent({
              contentGetter: () => {
                return `
                  <div class="row flex-items-center full-height max-full-width">
                    ${template}
                  </div>
                `;
              },
              scopesGetter: () => ({
                xNavScope: navComponent
                  ? navComponent.useComponent()
                  : undefined,
                xRouterViewScope: routerViewComponent.useComponent({
                  attributes: {
                    class: 'layout--content__router-view'
                  }
                })
              }),
              noWatcher: true,
              instant: true,
              attributes: {
                class: 'layout--content'
              }
            });
          }),
          _Footer,
          _DynamicHtmlView.then(async ({ useComponent }) => {
            const [mainThemeCss] = await instance.useScopedCss();
            return useComponent({
              contentGetter() {
                return mainThemeCss;
              },
              noWatcher: true,
              instant: true
            });
          })
        ]
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
        () => import('@remoteFiles/scss/theme/main/theme.main.scss')
      );
      return [this.getScopedCss(scssMainTheme.toString())];
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
