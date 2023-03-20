import type {
  IHTMLElementComponent,
  TMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: TMainScope) => {
  const { _DynamicHtmlView } = {
    _DynamicHtmlView: mainScope.asyncRegisterComponent(
      import(
        '/remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
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
          _DynamicHtmlView.then(async ({ useComponent }) => {
            return useComponent({
              templateGetter: () => {
                /*language=HTML */
                return `<h1>
                  ${mainScope.store.data.home.titleWithName || ''}
                </h1>`;
              }
            });
          }),
          async () => {
            const scopedCss = await (
              await fetch(
                '/remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.scss'
              )
            ).text();
            return instance.getScopedCss(scopedCss.toString());
          }
        ]
      });
    }
  }

  const instance = new mainScope.HTMLComponent(
    'nav-left-main-component',
    Component
  );
  return instance;
};

export default async (mainScope: TMainScope) => getComponent(mainScope);
