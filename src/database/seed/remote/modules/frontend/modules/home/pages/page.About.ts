import type {
  HTMLElementComponent,
  IHTMLComponent,
  IHTMLElementsScope,
} from '@remoteModules/frontend/engine/components/Main.js';

const scopedCss = `
<style staticScope lang="sass">
  about-component {
    button-component {
      button {            
        cursor: pointer;
        outline: 0;
        display: inline-block;
        font-weight: 400;
        line-height: 1.5;
        text-align: center;
        background-color: transparent;
        padding: 6px 12px;
        font-size: 1rem;
        border-radius: .25rem;
        transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out;
        color: #0d6efd;
        border: 1px solid #0d6efd;
        &:hover {
            color: #fff;
            background-color: #0d6efd;
            border-color: #0d6efd;
        }                      
      }
    }
  }
</style staticScope>`;

const getComponents = (mainScope: IHTMLElementsScope) => {
  return {
    DynamicHtmlView: mainScope.asyncRegisterComponent(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
        ),
    ),
    Button: mainScope.asyncRegisterComponent(
      () =>
        import(
          '@remoteModules/utils/sharedComponents/elements/button/Button.js'
        ),
    ),
  };
};

const getClass = (
  mainScope: IHTMLElementsScope,
  instance: ReturnType<typeof getSingleton>,
) => {
  const { DynamicHtmlView, Button } = instance.registerComponents();

  return class Component
    extends window.HTMLElement
    implements HTMLElementComponent
  {
    constructor() {
      super();
    }

    init() {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          DynamicHtmlView.then(({ useComponent }) =>
            useComponent?.({
              contentGetter() {
                return `
                    <h1>About Page</h1>
                  `;
              },
            }),
          ),
          Button.then(({ useComponent }) =>
            useComponent({
              onClick: () => mainScope.router.push('home'),
              label: 'Go To Home',
            }),
          ),
          DynamicHtmlView.then(({ useComponent }) =>
            useComponent({
              contentGetter() {
                return instance.useScopedCss();
              },
              noWatcher: true,
              instant: true,
            }),
          ),
        ],
      });
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent implements IHTMLComponent {
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
