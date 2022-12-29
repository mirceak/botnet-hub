import type {
  IHTMLComponent,
  IHTMLElementsScope,
} from '@remoteModules/frontend/engine/components/Main.js';

const scopedCss = `
<style staticScope lang="sass">
  home-component {
    input-component {
      input {
        padding: 6px 12px;
        font-size: 16px;
        font-weight: 400;
        line-height: 1.5;
        color: #212529;
        background-color: #fff;
        background-clip: padding-box;
        border: 1px solid #ced4da;
        appearance: none;
        border-radius: 4px;
        transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;
      &:focus{
          color: #212529;
          background-color: #fff;
          border-color: #86b7fe;
          outline: 0;
          box-shadow: 0 0 0 0.25rem rgb(13 110 253 / 25%);
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
    Input: mainScope.asyncRegisterComponent(
      () =>
        import('@remoteModules/utils/sharedComponents/form/elements/Input.js'),
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
  const { DynamicHtmlView, Input, Button } = instance.registerComponents();

  return class Component extends window.HTMLElement {
    constructor() {
      super();
    }

    async init() {
      await mainScope.asyncHydrationCallback(async () => {
        await mainScope.asyncLoadComponentTemplate({
          target: this,
          components: [
            Input.then(({ useComponent }) =>
              useComponent({
                onInput: (value: string) =>
                  (mainScope.store.data.home.nameInput = value),
                placeholder: 'Enter Your Name',
              }),
            ),
            Button.then(({ useComponent }) =>
              useComponent({
                onClick: () => mainScope.router.push('about'),
                label: 'Go To About',
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
      });
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent implements IHTMLComponent {
    componentName = 'home-component';

    initComponent = (mainScope: IHTMLElementsScope) => {
      if (!window.customElements.get(this.componentName)) {
        this.registerComponent(this.componentName, getClass(mainScope, this));
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

export const getInstance = (mainScope: IHTMLElementsScope) => {
  if (!componentInstance || window.SSR) {
    if (!componentInstance) {
      componentInstance = getSingleton(mainScope);
    }
    componentInstance.initComponent(mainScope);
  }
  return componentInstance;
};
