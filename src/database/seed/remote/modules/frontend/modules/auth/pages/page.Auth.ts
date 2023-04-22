import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

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
                innerText: () => mainScope.store.state.home.titleWithName
              })
            ]),
            o('<div>', { className: 'content', title: 'ases' }, (x99) => {
              console.log(-12, x99);
              return [
                async (x0) => {
                  console.log(0, x0);
                  return o('<input-component>', (x1) => {
                    console.log(1, x1);
                    return {
                      attributes: async (x22) => {
                        console.log(221, x22);
                        return {
                          className: 'bg-default m-b-8'
                        };
                      },
                      elementAttributes: (x2) => {
                        console.log(2, x2);
                        return {
                          placeholder: 'Username',
                          handlers: {
                            input: [
                              {
                                callback: async (e) => {
                                  e.preventDefault();
                                  mainScope.store.state.home.nameInput = (
                                    e.target as HTMLInputElement
                                  ).value;
                                }
                              }
                            ]
                          }
                        };
                      }
                    };
                  });
                },
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
              ];
            }),
            o('<div>', { className: 'actions' }, [
              o('<button-component>', () => ({
                elementAttributes: () => ({
                  innerText: 'Log In',
                  handlers: {
                    click: [
                      {
                        callback: async (e) => {
                          e.preventDefault();

                          mainScope.store.modules.user.state.auth = {
                            token: 'token'
                          };

                          void mainScope.router.push({
                            path: 'home'
                          });
                        }
                      }
                    ]
                  }
                }),
                attributes: { className: 'bg-primary' }
              }))
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
