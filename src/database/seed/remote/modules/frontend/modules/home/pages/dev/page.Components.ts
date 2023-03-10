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
  ),
  _Input: mainScope.asyncRegisterComponent(
    () =>
      import(
        '@remoteModules/utils/sharedComponents/elements/form/element.form.input.js'
      )
  )
});

const getClass = (
  mainScope: IHTMLElementsScope,
  instance: ReturnType<typeof getSingleton>
) => {
  const { _Button, _Input } = instance.registerComponents();

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
              template: /* HTML */ `<div class="card fit-content">
                  <div class="header row align-items-center">
                    <button-component
                      class="bg-primary m-r-16"
                      xScope="xButtonBack"
                    ></button-component>
                    <h1>Components</h1>
                  </div>
                  <div class="card">
                    <div class="header">
                      <h1>Buttons</h1>
                    </div>
                    <div class="row gap-8">
                      <button-component
                        xScope="xButtonDefault"
                      ></button-component>
                      <button-component
                        class="bg-primary"
                        xScope="xButtonPrimary"
                      ></button-component>
                      <button-component
                        class="bg-secondary"
                        xScope="xButtonSecondary"
                      ></button-component>
                      <button-component
                        class="bg-info"
                        xScope="xButtonInfo"
                      ></button-component>
                      <button-component
                        class="bg-warning"
                        xScope="xButtonWarning"
                      ></button-component>
                      <button-component
                        class="bg-danger"
                        xScope="xButtonDanger"
                      ></button-component>
                    </div>
                  </div>
                  <div class="card">
                    <div class="header">
                      <h1>Inputs</h1>
                    </div>
                    <div class="row gap-8">
                      <input-component xScope="xInputDefault"></input-component>
                      <input-component
                        class="bg-primary"
                        xScope="xInputPrimary"
                      ></input-component>
                      <input-component
                        class="bg-secondary"
                        xScope="xInputSecondary"
                      ></input-component>
                      <input-component
                        class="bg-info"
                        xScope="xInputInfo"
                      ></input-component>
                      <input-component
                        class="bg-warning"
                        xScope="xInputWarning"
                      ></input-component>
                      <input-component
                        class="bg-danger"
                        xScope="xInputDanger"
                      ></input-component>
                    </div>
                  </div>
                </div>
                ${scopedCss}`,
              scopesGetter: () => ({
                xButtonBack: _Button.then(({ useComponent }) => {
                  return useComponent({
                    onClick: () => void mainScope.router.push('home'),
                    label: 'Go Back'
                  });
                }),
                xButtonDefault: _Button.then(({ useComponent }) => {
                  return useComponent({
                    label: 'Default'
                  });
                }),
                xButtonPrimary: _Button.then(({ useComponent }) => {
                  return useComponent({
                    label: 'Primary'
                  });
                }),
                xButtonSecondary: _Button.then(({ useComponent }) => {
                  return useComponent({
                    label: 'Secondary'
                  });
                }),
                xButtonInfo: _Button.then(({ useComponent }) => {
                  return useComponent({
                    label: 'Info'
                  });
                }),
                xButtonWarning: _Button.then(({ useComponent }) => {
                  return useComponent({
                    label: 'Warning'
                  });
                }),
                xButtonDanger: _Button.then(({ useComponent }) => {
                  return useComponent({
                    label: 'Danger'
                  });
                }),
                xInputDefault: _Input.then(({ useComponent }) => {
                  return useComponent({
                    elementAttributes: {
                      placeholder: 'Default'
                    }
                  });
                }),
                xInputPrimary: _Input.then(({ useComponent }) => {
                  return useComponent({
                    elementAttributes: {
                      placeholder: 'Primary'
                    }
                  });
                }),
                xInputSecondary: _Input.then(({ useComponent }) => {
                  return useComponent({
                    elementAttributes: {
                      placeholder: 'Secondary'
                    }
                  });
                }),
                xInputInfo: _Input.then(({ useComponent }) => {
                  return useComponent({
                    elementAttributes: {
                      placeholder: 'Info'
                    }
                  });
                }),
                xInputWarning: _Input.then(({ useComponent }) => {
                  return useComponent({
                    elementAttributes: {
                      placeholder: 'Warning'
                    }
                  });
                }),
                xInputDanger: _Input.then(({ useComponent }) => {
                  return useComponent({
                    elementAttributes: {
                      placeholder: 'Danger'
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
    componentName = 'components-component';

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
          import(
            '@remoteModules/frontend/modules/home/pages/dev/page.Components.scss'
          )
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
