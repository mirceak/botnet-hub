import type {
  IHTMLElementsScope,
  InstancedHTMLComponent
} from '@remoteModules/frontend/engine/components/Main.js';

const scopedCss = `
  <style staticScope>
    @import 'src/database/seed/remote/modules/utils/assets/scss/variables/color.scss';
		
		    main-component {
		
		    nav-left-main-component {
			background-color: $blue;
			color: white;
			display: flex;
			min-width: 284px;
			max-width: 284px;
			height: 100%;
		}}

    </style staticScope>`;

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
                  <h1>${mainScope.store.data.home.titleWithName || ''}</h1>
                `;
              }
            })
          ),
          _DynamicHtmlView.then(({ useComponent }) =>
            useComponent({
              contentGetter() {
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
