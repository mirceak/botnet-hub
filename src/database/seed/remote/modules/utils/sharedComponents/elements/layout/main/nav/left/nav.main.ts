import type {
  IHTMLElementsScope,
  IHTMLElementComponent
} from '@remoteModules/frontend/engine/components/Main.js';

const getComponents = (mainScope: IHTMLElementsScope) => ({
  _DynamicHtmlView: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
      )
  )
});

const getClass = (
  mainScope: IHTMLElementsScope,
  instance: ReturnType<typeof getSingleton>
) => {
  const { _DynamicHtmlView } = instance.registerComponents();

  return class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    constructor() {
      super();
    }

    init() {
      void mainScope.asyncHydrationCallback(async () => {
        const scopedCss = await instance.useScopedCss();
        void mainScope.asyncLoadComponentTemplate({
          target: this,
          components: [
            _DynamicHtmlView.then(async ({ useComponent }) => {
              return useComponent({
                templateGetter() {
                  return /* HTML */ `<h1>
                    ${mainScope.store.data.home.titleWithName || ''}
                  </h1>`;
                }
              });
            }),
            scopedCss
          ]
        });
      });
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'nav-left-main-component';

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

    useComponent = () => {
      return this.getComponentScope(this.componentName);
    };

    useScopedCss = async () => {
      const scopedCss = await mainScope.loadFile(
        () =>
          import(
            '@remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.scss'
          )
      );
      return this.getScopedCss(scopedCss.toString());
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
