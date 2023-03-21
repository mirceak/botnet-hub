import type {
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope) => {
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

  const scopedCss = fetch(
    '/remoteModules/frontend/modules/auth/pages/page.Auth.scss'
  ).then((response) => response.text());
  const scssMainTheme = fetch(
    '/remoteModules/utils/assets/scss/theme/main/theme.main.scss'
  ).then((response) => response.text());

  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
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

  const instance = new mainScope.HTMLComponent('auth-component', Component);
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
