import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { _Input, _Button } = {
    _Button: mainScope.asyncComponent(
      () =>
        import(
          '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
        )
    ),
    _Input: mainScope.asyncComponent(
      () =>
        import(
          '/remoteModules/utils/sharedComponents/elements/form/inputs/element.form.input.js'
        )
    )
  };

  const scopedCss = mainScope.asyncStaticFile(
    () =>
      import(
        '/remoteModules/frontend/modules/home/pages/dev/page.Components.scss'
      )
  );

  class Element extends mainScope.HTMLElement {
    initElement = this.useInitElement(mainScope, () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          async () => {
            return {
              /* language=HTML */
              template: `
                <div class="card gap-8 m-a-16 fit-content">
                  <div class="header row items-center">
                    <button-component
                        class="bg-primary m-r-16"
                        wcScope="xButtonBack">
                    </button-component>
                    <h1>Components</h1>
                  </div>
                  <div class="card">
                    <div class="m-b-16">
                      <h1>Buttons</h1>
                    </div>
                    <div class="row gap-8">
                      <button-component wcScope="xButtonDefault">
                      </button-component>
                      <button-component
                          class="bg-primary"
                          wcScope="xButtonPrimary">
                      </button-component>
                      <button-component
                          class="bg-secondary"
                          wcScope="xButtonSecondary">
                      </button-component>
                      <button-component
                          class="bg-info"
                          wcScope="xButtonInfo">
                      </button-component>
                      <button-component
                          class="bg-warning"
                          wcScope="xButtonWarning">
                      </button-component>
                      <button-component
                          class="bg-danger"
                          wcScope="xButtonDanger">
                      </button-component>
                    </div>
                  </div>
                  <div class="card">
                    <div class="m-b-16">
                      <h1>Inputs</h1>
                    </div>
                    <div class="row gap-8">
                      <input-component wcScope="xInputDefault">
                      </input-component>
                      <input-component
                          class="bg-primary"
                          wcScope="xInputPrimary">
                      </input-component>
                      <input-component
                          class="bg-secondary"
                          wcScope="xInputSecondary">
                      </input-component>
                      <about-component></about-component>
                      <input-component
                          class="bg-info"
                          wcScope="xInputInfo">
                      </input-component>
                      <input-component
                          class="bg-warning"
                          wcScope="xInputWarning">
                      </input-component>
                      <input-component
                          class="bg-danger"
                          wcScope="xInputDanger">
                      </input-component>
                    </div>
                  </div>
                </div>`,
              scopesGetter() {
                return {
                  xButtonBack: _Button.then(({ getScope }) => {
                    return getScope({
                      onClick() {
                        mainScope.router.push('home');
                      },
                      elementAttributes: {
                        innerText: 'Back'
                      }
                    });
                  }),
                  xButtonDefault: _Button.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        innerText: 'Default'
                      }
                    });
                  }),
                  xButtonPrimary: _Button.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        innerText: 'Primary'
                      }
                    });
                  }),
                  xButtonSecondary: _Button.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        innerText: 'Secondary'
                      }
                    });
                  }),
                  xButtonInfo: _Button.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        innerText: 'Info'
                      }
                    });
                  }),
                  xButtonWarning: _Button.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        innerText: 'Warning'
                      }
                    });
                  }),
                  xButtonDanger: _Button.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        innerText: 'Danger'
                      }
                    });
                  }),
                  xInputDefault: _Input.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        placeholder: 'Default'
                      }
                    });
                  }),
                  xInputPrimary: _Input.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        placeholder: 'Primary'
                      }
                    });
                  }),
                  xInputSecondary: _Input.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        placeholder: 'Secondary'
                      }
                    });
                  }),
                  xInputInfo: _Input.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        placeholder: 'Info'
                      }
                    });
                  }),
                  xInputWarning: _Input.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        placeholder: 'Warning'
                      }
                    });
                  }),
                  xInputDanger: _Input.then(({ getScope }) => {
                    return getScope({
                      elementAttributes: {
                        placeholder: 'Danger'
                      }
                    });
                  })
                };
              }
            };
          },
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    });
  }

  const instance = new mainScope.HTMLComponent(
    tagName || 'components-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
