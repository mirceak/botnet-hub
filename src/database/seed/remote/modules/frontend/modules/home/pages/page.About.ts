import type {
  IHTMLElementsScope,
  InstancedHTMLComponent
} from '@remoteModules/frontend/engine/components/Main.js';

/*language=html*/
const scopedCss = `
	<style staticScope>
         main-component {
		
      about-component {
			display: flex;
			flex-direction: column;
			align-items: center;
		}
			
		}
	</style staticScope>`;

const getComponents = (mainScope: IHTMLElementsScope) => ({
  _DynamicHtmlView: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
      )
  ),
  _Button: mainScope.asyncRegisterComponent(
    () =>
      import('@remoteModules/utils/sharedComponents/elements/button/Button.js')
  )
});

const getClass = (
  mainScope: IHTMLElementsScope,
  instance: ReturnType<typeof getSingleton>
) => {
  const { _DynamicHtmlView, _Button } = instance.registerComponents();

  return class Component
    extends mainScope.HTMLElement
    implements InstancedHTMLComponent
  {
    constructor() {
      super();
    }

    init() {
      void mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          _DynamicHtmlView.then(({ useComponent }) =>
            useComponent({
              contentGetter: () => {
                return `
                  <h1>About Page</h1>
                `;
              }
            })
          ),
          _Button.then(({ useComponent }) =>
            useComponent({
              onClick: () => void mainScope.router.push('home'),
              label: 'Go To Home'
            })
          ),
          _DynamicHtmlView.then(({ useComponent }) =>
            useComponent({
              contentGetter: () => {
                return instance.useScopedCss();
              },
              noWatcher: true,
              instant: true
            })
          )
        ]
      });
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'about-component';

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope, this));
      } else if (mainScope.SSR) {
        this.registerComponents();
      }
    };

    registerComponents = () => {
      return getComponents(mainScope);
    };

    useComponent = () => {
      return this.getComponentScope(this.componentName);
    };

    useScopedCss = () => {
      return this.getScopedCss(scopedCss);
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
