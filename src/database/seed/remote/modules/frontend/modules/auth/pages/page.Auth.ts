import type {
  IHTMLElementsScope,
  IHTMLElementComponent
} from '@remoteModules/frontend/engine/components/Main.js';

const getComponents = (mainScope: IHTMLElementsScope) => ({
  _Input: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/elements/form/element.form.input.js'
      )
  ),
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
  const { _Input, _Button } = instance.registerComponents();

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
              template: /* HTML */ ` <div class="card">
                  <div class="m-b-16">
                    <h1>Welcome!</h1>
                  </div>
                  <input-component
                    class="bg-default m-b-8"
                    xScope="xInputUserScope"
                  ></input-component>
                  <input-component
                    class="bg-default"
                    xScope="xInputPassScope"
                  ></input-component>
                  <div class="actions">
                    <button-component
                      class="bg-primary"
                      xScope="xButtonScope"
                    ></button-component>
                  </div>
                </div>
                ${scopedCss}`,
              scopesGetter: () => ({
                xButtonScope: _Button.then(({ useComponent }) => {
                  return useComponent({
                    onClick: () => void mainScope.router.push('home'),
                    label: 'Log In'
                  });
                }),
                xInputUserScope: _Input.then(({ useComponent }) => {
                  return useComponent({
                    onInput: (value: string) => void console.log(value),
                    elementAttributes: {
                      placeholder: 'Username'
                    }
                  });
                }),
                xInputPassScope: _Input.then(({ useComponent }) => {
                  return useComponent({
                    onInput: (value: string) => void console.log(value),
                    elementAttributes: {
                      placeholder: 'Password',
                      type: 'password',
                      autocomplete: 'new-password'
                    }
                  });
                })
              })
            }
          ]
        });
      });
    }
  };
};

const getSingleton = (mainScope: IHTMLElementsScope) => {
  class Instance extends mainScope.HTMLComponent {
    componentName = 'auth-component';

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
          import('@remoteModules/frontend/modules/auth/pages/page.Auth.scss')
      );
      const scssMainTheme = await mainScope.loadFile(
        () =>
          import('@remoteModules/utils/assets/scss/theme/main/theme.main.scss')
      );
      return this.getScopedCss(scopedCss) + this.getScopedCss(scssMainTheme);
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
