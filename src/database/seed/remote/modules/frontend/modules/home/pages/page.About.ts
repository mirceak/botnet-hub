import type {
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope) => {
  const { _Button } = {
    _Button: mainScope.asyncComponent(() =>
      mainScope.asyncStaticModule(
        () =>
          import(
            '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
          )
      )
    )
  };

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/frontend/modules/home/pages/page.About.scss')
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
          {
            /* language=HTML */
            template: `
              <h1>About Page</h1>
              <button-component wcScope="xButtonScope">
              </button-component>
            `,
            scopesGetter: async () => ({
              xButtonScope: _Button.then(({ getScope }) =>
                getScope({
                  onClick() {
                    mainScope.router.push('home');
                  },
                  label: 'Go Home'
                })
              )
            })
          },
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    }
  }

  const instance = new mainScope.HTMLComponent('about-component', Component);
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
