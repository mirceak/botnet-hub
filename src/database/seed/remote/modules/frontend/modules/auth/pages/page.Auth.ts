import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';
import type { initModel } from '/remoteModules/services/models/User/model.User.js';

const getComponent = (mainScope: IMainScope) => {
  const { o } = mainScope.useComponentsObject({
    ['button-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/form/element.form.button.js'
      ),
    ['input-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/form/inputs/element.form.input.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/frontend/modules/auth/pages/page.Auth.scss')
  );
  const scssMainTheme = mainScope.asyncStaticFile(
    () => import('/remoteModules/utils/assets/scss/theme/main/theme.main.scss')
  );

  return mainScope.useComponentRegister('auth-component', (options) => {
    options.useInitElement(async () => {
      options.asyncLoadComponentTemplate({
        components: [
          o('<div>', { className: 'card glow flex justify-center-xs-min' }, [
            o('<div>', { className: 'm-b-16' }, [
              o('<h1>', {
                innerText: () => mainScope.store.data.home.titleWithName
              })
            ]),
            o('<div>', { className: 'content' }, [
              o('<input-component>', () => ({
                elementAttributes: {
                  placeholder: 'Username',
                  handlers: {
                    input: [
                      {
                        callback: async (e) => {
                          e.preventDefault();
                          mainScope.store.data.home.nameInput = (
                            e.target as HTMLInputElement
                          ).value;
                        }
                      }
                    ]
                  }
                },
                attributes: {
                  className: 'bg-default m-b-8'
                }
              })),
              o('<input-component>', {
                elementAttributes: {
                  placeholder: 'Password',
                  type: 'password',
                  handlers: {
                    input: [
                      {
                        callback: async (e) => {
                          e.preventDefault();
                          console.log((e.target as HTMLInputElement).value);
                        }
                      }
                    ]
                  }
                },
                attributes: { className: 'bg-default' }
              })
            ]),
            o('<div>', { className: 'actions' }, [
              o('<button-component>', {
                elementAttributes: {
                  innerText: 'Log In',
                  handlers: {
                    click: [
                      {
                        callback: async (e) => {
                          e.preventDefault();
                          const userStoreData = mainScope.store.modules.user
                            .data as Awaited<
                            ReturnType<typeof initModel>
                          >['data'];

                          userStoreData.auth = { token: 'token' };

                          void mainScope.router.push({
                            path: 'home'
                          });
                        }
                      }
                    ]
                  }
                },
                attributes: { className: 'bg-primary' }
              })
            ])
          ]),

          async () => {
            return (
              options.getScopedCss(await scopedCss) +
              options.getScopedCss(
                mainScope.applyBreakpoints(await scssMainTheme)
              )
            );
          }
        ]
      });
    });
  });
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
