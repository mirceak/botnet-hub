import type {
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject({
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
    () => import('/remoteModules/frontend/modules/home/pages/page.Home.scss')
  );

  class Element
    extends mainScope.BaseHtmlElement
    implements IHTMLElementComponent
  {
    initElement = this.useInitElement(mainScope, () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          o('<input-component>', {
            attributes: {
              className: 'm-t-64'
            },
            elementAttributes: {
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
              },
              placeholder: 'Enter some text...'
            }
          }),
          o('<button-component>', {
            elementAttributes: {
              handlers: {
                click: [
                  {
                    callback: async (e) => {
                      e.preventDefault();
                      mainScope.router.push({
                        name: 'about'
                      });
                    }
                  }
                ]
              },
              innerText: 'About'
            }
          }),
          o('<button-component>', {
            elementAttributes: {
              handlers: {
                click: [
                  {
                    callback: async (e) => {
                      e.preventDefault();
                      mainScope.router.push({
                        name: 'components'
                      });
                    }
                  }
                ]
              },
              innerText: 'Dev Components',
              className: 'bg-primary'
            }
          }),
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    });
  }

  const instance = new mainScope.BaseComponent(
    tagName || 'home-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
