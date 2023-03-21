import type {
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope) => {
  const { _DynamicHtmlView } = {
    _DynamicHtmlView: mainScope.asyncComponent(() =>
      mainScope.asyncStaticModule(
        () =>
          import(
            '/remoteModules/utils/sharedComponents/dynamicViews/html/DynamicHtmlView.js'
          )
      )
    )
  };

  const scopedCss = mainScope.asyncStaticFile(
    () =>
      import(
        '/remoteModules/utils/sharedComponents/elements/layout/main/nav/left/nav.main.scss'
      )
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
          _DynamicHtmlView.then(async ({ getScope }) => {
            return getScope({
              templateGetter() {
                /* language=HTML */
                return `<h1>
                  ${mainScope.store.data.home.titleWithName || ''}
                </h1>`;
              }
            });
          }),
          async () => {
            return instance.getScopedCss(await scopedCss);
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

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
