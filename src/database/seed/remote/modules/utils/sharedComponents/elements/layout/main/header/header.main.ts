import type {
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject();

  const scopedCss = mainScope.asyncStaticFile(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/header/header.main.scss'
      )
  );

  class Element
    extends mainScope.BaseHtmlElement
    implements IHTMLElementComponent
  {
    initElement = this.useInitElement(mainScope, async () => {
      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          o('<h1>', {
            innerText: 'FullStack.js'
          }),
          async () => {
            return instance.getScopedCss(await scopedCss);
          }
        ]
      });
    });
  }

  const instance = new mainScope.BaseComponent(
    tagName || 'header-main-component',
    Element
  );
  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
