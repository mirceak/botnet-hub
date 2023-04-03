import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: b } = mainScope.useComponents({
    ['button-component']: () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
      ),
    ['input-component']: () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/form/inputs/element.form.input.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/frontend/modules/auth/pages/page.Auth.scss')
  );
  const scssMainTheme = mainScope.asyncStaticFile(
    () => import('/remoteModules/utils/assets/scss/theme/main/theme.main.scss')
  );

  class Element extends mainScope.HTMLElement {
    initElement = this.useInitElement(mainScope, async () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          b('<div>', { className: 'card glow' }, [
            b('<div>', { className: 'm-b-16' }, [
              b('<h1>', { innerText: 'Welcome!' })
            ]),
            b('<input-component>', {
              elementAttributes: { placeholder: 'Username' },
              attributes: { className: 'bg-default m-b-8' },
              onInput(value: string) {
                console.log(value);
              }
            }),
            b('<input-component>', {
              elementAttributes: { placeholder: 'Password', type: 'password' },
              attributes: { className: 'bg-default' },
              onInput(value: string) {
                console.log(value);
              }
            }),
            b('<div>', { className: 'actions' }, [
              b('<button-component>', {
                elementAttributes: { innerText: 'Log In' },
                attributes: { className: 'bg-primary' },
                onClick() {
                  mainScope.router.push('home');
                }
              })
            ])
          ]),

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
    });
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
