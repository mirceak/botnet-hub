import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = await mainScope.useComponentsObject({
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
          o('<div>', { className: 'card glow flex justify-center-xs-min' }, [
            o('<div>', { className: 'm-b-16' }, [
              o('<h1>', {
                innerText: () => mainScope.store.data.home.titleWithName
              })
            ]),
            o('<div>', { className: 'content' }, async () => [
              o('<input-component>', {
                elementAttributes: { placeholder: 'Username' },
                attributes: {
                  className: 'bg-default m-b-8'
                },
                onInput(value: string) {
                  mainScope.store.data.home.nameInput = value;
                }
              }),
              async () =>
                o('<input-component>', async () => ({
                  elementAttributes: {
                    placeholder: 'Password',
                    type: 'password'
                  },
                  attributes: { className: 'bg-default' },
                  onInput(value: string) {
                    console.log(value);
                  }
                }))
            ]),
            () =>
              o('<div>', { className: 'actions' }, [
                o('<button-component>', {
                  elementAttributes: { innerText: 'Log In' },
                  attributes: { className: 'bg-primary' },
                  ss: 'asd',
                  onClick() {
                    mainScope.router.push({ name: 'home' });
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
