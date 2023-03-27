import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { _Input, _Button } = {
    _Button: mainScope.asyncComponent(() =>
      mainScope.asyncStaticModule(
        () =>
          import(
            '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
          )
      )
    ),
    _Input: mainScope.asyncComponent(() =>
      mainScope.asyncStaticModule(
        () =>
          import(
            '/remoteModules/utils/sharedComponents/elements/form/inputs/element.form.input.js'
          )
      )
    )
  };

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/frontend/modules/auth/pages/page.Auth.scss')
  );
  const scssMainTheme = mainScope.asyncStaticFile(
    () => import('/remoteModules/utils/assets/scss/theme/main/theme.main.scss')
  );

  class Element extends mainScope.HTMLElement {
    constructor() {
      super();
    }

    async initElement() {
      await mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          {
            /* language=HTML */
            template: `
              <div class="card glow">
                <div class="m-b-16">
                  <h1>Welcome!</h1>
                </div>
                <input-component
                    class="bg-default m-b-8"
                    wcScope="xInputUserScope"
                >
                </input-component>
                <input-component
                    class="bg-default"
                    wcScope="xInputPassScope"
                >
                </input-component>
                <div class="actions">
                  <button-component
                      class="bg-primary"
                      wcScope="xButtonScope"
                  >
                  </button-component>
                </div>
              </div>`,
            scopesGetter() {
              return {
                xButtonScope: _Button.then(({ getScope }) => {
                  return getScope({
                    onClick() {
                      mainScope.router.push('home');
                    },
                    label: 'Log In'
                  });
                }),
                xInputUserScope: _Input.then(({ getScope }) => {
                  return getScope({
                    onInput(value: string) {
                      console.log(value);
                    },
                    elementAttributes: {
                      placeholder: 'Username'
                    }
                  });
                }),
                xInputPassScope: _Input.then(({ getScope }) => {
                  return getScope({
                    onInput(value: string) {
                      console.log(value);
                    },
                    elementAttributes: {
                      placeholder: 'Password',
                      type: 'password',
                      autocomplete: 'new-password'
                    }
                  });
                })
              };
            }
          },
          async () => {
            return (
              instance.getScopedCss(await scopedCss) +
              instance.getScopedCss(
                mainScope.applyBreakpoints(await scssMainTheme)
              )
            );
          }
        ]
      });
    }
  }

  const instance = new mainScope.HTMLComponent(
    tagName || 'auth-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
