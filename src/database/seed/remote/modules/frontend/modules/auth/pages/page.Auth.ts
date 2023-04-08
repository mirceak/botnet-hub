import type {
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject({
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

  class Element
    extends mainScope.BaseHtmlElement
    implements IHTMLElementComponent
  {
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
            o('<div>', { className: 'content' }, [
              o('<input-component>', {
                elementAttributes: { placeholder: 'Username' },
                attributes: {
                  className: 'bg-default m-b-8'
                },
                onInput(value: string) {
                  mainScope.store.data.home.nameInput = value;
                }
              }),

              o('<input-component>', {
                elementAttributes: {
                  placeholder: 'Password',
                  type: 'password'
                },
                attributes: { className: 'bg-default' },
                onInput(value: string) {
                  console.log(value);
                }
              })
            ]),
            o('<div>', { className: 'actions' }, [
              o('<button-component>', {
                elementAttributes: { innerText: 'Log In' },
                attributes: { className: 'bg-primary' },
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

  const instance = new mainScope.BaseComponent(
    tagName || 'auth-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
