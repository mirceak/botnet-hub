import type {
  IHTMLElementComponent,
  TMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: TMainScope) => {
  const { _Input, _Button } = {
    _Button: mainScope.asyncRegisterComponent(
      import(
        '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
      )
    ),
    _Input: mainScope.asyncRegisterComponent(
      import(
        '/remoteModules/utils/sharedComponents/elements/form/element.form.input.js'
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
          {
            /*language=HTML */
            template: `
              <div class="card glow">
                <div class="m-b-16">
                  <h1>Welcome!</h1>
                </div>
                <input-component
                    class="bg-default m-b-8"
                    xScope="xInputUserScope"
                >
                </input-component>
                <input-component
                    class="bg-default"
                    xScope="xInputPassScope"
                >
                </input-component>
                <div class="actions">
                  <button-component
                      class="bg-primary"
                      xScope="xButtonScope"
                  >
                  </button-component>
                </div>
              </div>`,
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
          },
          async () => {
            const scopedCss = await (
              await fetch(
                '/remoteModules/frontend/modules/auth/pages/page.Auth.scss'
              )
            ).text();
            const scssMainTheme = await (
              await fetch(
                '/remoteModules/utils/assets/scss/theme/main/theme.main.scss'
              )
            ).text();
            return (
              instance.getScopedCss(scopedCss) +
              instance.getScopedCss(mainScope.applyBreakpoints(scssMainTheme))
            );
          }
        ]
      });
    }
  }

  const instance = new mainScope.HTMLComponent('auth-component', Component);
  return instance;
};

export default (mainScope: TMainScope) => getComponent(mainScope);
