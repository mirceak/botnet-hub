import type {
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope) => {
  const { _Button } = {
    _Button: mainScope.asyncComponent(
      import(
        '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
      )
    )
  };

  const scopedCss = fetch(
    '/remoteModules/frontend/modules/home/pages/page.About.scss'
  ).then((response) => response.text());

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
              <h1>About Page</h1>
              <button-component xScope="xButtonScope">
              </button-component>
            `,
            scopesGetter: async () => ({
              xButtonScope: _Button.then(({ useComponent }) =>
                useComponent({
                  onClick: () => void mainScope.router.push('home'),
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
