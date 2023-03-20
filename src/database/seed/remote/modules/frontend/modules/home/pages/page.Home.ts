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
          _Input.then(({ useComponent }) =>
            useComponent({
              onInput: (value: string) =>
                (mainScope.store.data.home.nameInput = value),
              elementAttributes: {
                placeholder: 'Enter Your Name...'
              }
            })
          ),
          _Button.then(({ useComponent }) =>
            useComponent({
              onClick: () => void mainScope.router.push('about'),
              label: 'Go To About'
            })
          ),
          _Button.then(({ useComponent }) =>
            useComponent({
              onClick: () => void mainScope.router.push('components'),
              label: 'Go To Components',
              elementAttributes: {
                class: 'bg-primary'
              }
            })
          ),
          {
            /*language=HTML */
            template: `
                <div class="row column">
                    <small>Consider this scoped</small>
                    <input-component xScope="xInputScope">
                    </input-component>

                    <button-component xScope="xButtonScope">
                    </button-component>
                </div>
                <div class="row column">
                    <small>Consider this nested and scoped</small>
                    <input-component xScope="xSecInputScope">
                    </input-component>
                    <button-component xScope="xSecButtonScope">
                    </button-component>
                </div>
            `,
            scopesGetter: () => ({
              xInputScope: _Input.then(({ useComponent }) =>
                useComponent({
                  onInput: (value: string) =>
                    (mainScope.store.data.home.nameInput = value),
                  elementAttributes: {
                    placeholder: 'Test Input'
                  }
                })
              ),
              xButtonScope: _Button.then(({ useComponent }) =>
                useComponent({
                  label: 'Test Button'
                })
              ),
              xSecInputScope: _Input.then(({ useComponent }) =>
                useComponent({
                  onInput: (value: string) =>
                    (mainScope.store.data.home.nameInput = value),
                  elementAttributes: {
                    class: 'p-x-16',
                    placeholder: 'Test Nested Input'
                  }
                })
              ),
              xSecButtonScope: _Button.then(({ useComponent }) =>
                useComponent({
                  label: 'Test Nested Button'
                })
              )
            })
          },
          async () => {
            const scopedCss = await (
              await fetch(
                '/remoteModules/frontend/modules/home/pages/page.Home.scss'
              )
            ).text();
            return instance.getScopedCss(scopedCss);
          }
        ]
      });
    }
  }

  const instance = new mainScope.HTMLComponent('home-component', Component);
  return instance;
};

export default (mainScope: TMainScope) => getComponent(mainScope);
