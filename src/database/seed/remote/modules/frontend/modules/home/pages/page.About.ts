import type {
  IHTMLElementComponent,
  TMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: TMainScope) => {
  const { _Button } = {
    _Button: mainScope.asyncRegisterComponent(
      import(
        '/remoteModules/utils/sharedComponents/elements/form/element.form.button.js'
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
          {
            /*language=HTML */
            template: `
              <h1>About Page</h1>
              <button-component xScope="xButtonScope">
              </button-component>
            `,
            scopesGetter: () => ({
              xButtonScope: _Button.then(({ useComponent }) =>
                useComponent({
                  onClick: () => void mainScope.router.push('home'),
                  label: 'Go Home'
                })
              )
            })
          },
          async () => {
            const scopedCss = await (
              await fetch(
                '/remoteModules/frontend/modules/home/pages/page.About.scss'
              )
            ).text();
            return instance.getScopedCss(scopedCss);
          }
        ]
      });
    }
  }

  const instance = new mainScope.HTMLComponent<L>('about-component', Component);
  return instance;
};

interface L {
  sex?: string;
}

export default async (mainScope: TMainScope) => getComponent(mainScope);
