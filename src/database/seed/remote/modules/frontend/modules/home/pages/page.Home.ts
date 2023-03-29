import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope, tagName?: string) => {
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

  class Element extends mainScope.HTMLElement {
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
              label: 'About'
            })
          ),
          _Button.then(({ getScope }) =>
            getScope({
              onClick() {
                mainScope.router.push('components');
              },
              label: 'Dev Components',
              elementAttributes: {
                className: 'bg-primary'
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
                      className: 'p-x-16',
                      placeholder: 'Test Input'
                    }
                  })
                ),
                xSecButtonScope: _Button.then(({ getScope }) =>
                  getScope({
                    label: 'Test Button'
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

  const instance = new mainScope.HTMLComponent(
    tagName || 'home-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
