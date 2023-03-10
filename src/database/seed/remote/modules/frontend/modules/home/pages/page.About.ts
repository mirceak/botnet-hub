import type {
  IHTMLElementsScope,
  IHTMLElementComponent
} from '@remoteModules/frontend/engine/components/Main.js';

const getComponents = (mainScope: IHTMLElementsScope) => ({
  _Button: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
      )
  )
});

const getClass = (
  mainScope: IHTMLElementsScope,
  instance: ReturnType<typeof getSingleton>
) => {
  const { _Button } = instance.registerComponents();

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
            {
              template: /* HTML */ `<h1>About Page</h1>
                <button-component xScope="xButtonScope"></button-component>`,
              scopesGetter: () => ({
                xButtonScope: _Button.then(({ useComponent }) =>
                  useComponent({
                    onClick: () => void mainScope.router.push('home'),
                    label: 'Go Home'
                  })
                )
              })
            },
            scopedCss
          ]
        });
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

    useScopedCss = async () => {
      const scopedCss = await mainScope.loadFile(
        () =>
          import('@remoteModules/frontend/modules/home/pages/page.About.scss')
      );
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
