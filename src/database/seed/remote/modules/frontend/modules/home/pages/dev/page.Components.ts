import type {
  IHTMLElementComponent,
  TMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: TMainScope) => {
  const { _Input, _Button } = {
    _Button: mainScope.asyncComponent(
      import(
        '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
      )
    ),
    _Input: mainScope.asyncComponent(
      import(
        '/remoteModules/utils/sharedComponents/elements/form/inputs/element.form.input.js'
      )
    )
  };

  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    constructor() {
      super();
    }

    async init() {
      await mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          async () => {
            return {
              /*language=HTML */
              template: `
                <div class="card gap-8 m-a-16 fit-content">
                  <div class="header row items-center">
                    <button-component
                        class="bg-primary m-r-16"
                        xScope="xButtonBack">
                    </button-component>
                    <h1>Components</h1>
                  </div>
                  <div class="card">
                    <div class="m-b-16">
                      <h1>Buttons</h1>
                    </div>
                    <div class="row gap-8">
                      <button-component xScope="xButtonDefault">
                      </button-component>
                      <button-component
                          class="bg-primary"
                          xScope="xButtonPrimary">
                      </button-component>
                      <button-component
                          class="bg-secondary"
                          xScope="xButtonSecondary">
                      </button-component>
                      <button-component
                          class="bg-info"
                          xScope="xButtonInfo">
                      </button-component>
                      <button-component
                          class="bg-warning"
                          xScope="xButtonWarning">
                      </button-component>
                      <button-component
                          class="bg-danger"
                          xScope="xButtonDanger">
                      </button-component>
                    </div>
                  </div>
                  <div class="card">
                    <div class="m-b-16">
                      <h1>Inputs</h1>
                    </div>
                    <div class="row gap-8">
                      <input-component xScope="xInputDefault">
                      </input-component>
                      <input-component
                          class="bg-primary"
                          xScope="xInputPrimary">
                      </input-component>
                      <input-component
                          class="bg-secondary"
                          xScope="xInputSecondary">
                      </input-component>
                      <input-component
                          class="bg-info"
                          xScope="xInputInfo">
                      </input-component>
                      <input-component
                          class="bg-warning"
                          xScope="xInputWarning">
                      </input-component>
                      <input-component
                          class="bg-danger"
                          xScope="xInputDanger">
                      </input-component>
                    </div>
                  </div>
                </div>`,
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
            };
          },
          async () => {
            const scopedCss = await (
              await fetch(
                '/remoteModules/frontend/modules/home/pages/dev/page.Components.scss'
              )
            ).text();
            return instance.getScopedCss(scopedCss);
          }
        ]
      });
    }
  }

  const instance = new mainScope.HTMLComponent(
    'components-component',
    Component
  );
  return instance;
};

export default async (mainScope: TMainScope) => getComponent(mainScope);
