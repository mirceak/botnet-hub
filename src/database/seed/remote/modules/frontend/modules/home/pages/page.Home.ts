import type {
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope) => {
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
    () => import('/remoteModules/frontend/modules/home/pages/page.Home.scss')
  );

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
          _Input.then(({ getScope }) =>
            getScope({
              onInput(value: string) {
                mainScope.store.data.home.nameInput = value;
              },
              elementAttributes: {
                placeholder: 'Enter Your Name...'
              }
            })
          ),
          _Button.then(({ getScope }) =>
            getScope({
              onClick() {
                mainScope.router.push('about');
              },
              label: 'Go To About'
            })
          ),
          _Button.then(({ getScope }) =>
            getScope({
              onClick() {
                mainScope.router.push('components');
              },
              label: 'Go To Components',
              elementAttributes: {
                class: 'bg-primary'
              }
            })
          ),
          {
            /* language=HTML */
            template: `
                <div class="row column">
                    <small>Consider this scoped</small>
                    <input-component wcScope="xInputScope">
                    </input-component>

                    <button-component wcScope="xButtonScope">
                    </button-component>
                </div>
                <div class="row column">
                    <small>Consider this nested and scoped</small>
                    <input-component wcScope="xSecInputScope">
                    </input-component>
                    <button-component wcScope="xSecButtonScope">
                    </button-component>
                </div>
            `,
            scopesGetter() {
              return {
                xInputScope: _Input.then(({ getScope }) =>
                  getScope({
                    onInput(value: string) {
                      mainScope.store.data.home.nameInput = value;
                    },
                    elementAttributes: {
                      placeholder: 'Test Input'
                    }
                  })
                ),
                xButtonScope: _Button.then(({ getScope }) =>
                  getScope({
                    label: 'Test Button'
                  })
                ),
                xSecInputScope: _Input.then(({ getScope }) =>
                  getScope({
                    onInput(value: string) {
                      mainScope.store.data.home.nameInput = value;
                    },
                    elementAttributes: {
                      class: 'p-x-16',
                      placeholder: 'Test Nested Input'
                    }
                  })
                ),
                xSecButtonScope: _Button.then(({ getScope }) =>
                  getScope({
                    label: 'Test Nested Button'
                  })
                )
              };
            }
          },
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    }
  }

  const instance = new mainScope.HTMLComponent('home-component', Component);
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
