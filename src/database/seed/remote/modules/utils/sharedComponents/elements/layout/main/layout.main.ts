import type {
  IComponentStaticScope,
  IComponentScope,
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IComponentScope {
  scopesGetter: Promise<{
    _Header: Promise<IComponentStaticScope>;
    _Footer: Promise<IComponentStaticScope>;
    _Nav: Promise<IComponentStaticScope>;
  }>;
}

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject({
    ['router-view-component']: () =>
      import(
        '/remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/utils/assets/scss/theme/main/theme.main.scss')
  );

  class Element
    extends mainScope.BaseHtmlElement
    implements IHTMLElementComponent
  {
    /* *Required here and not in the "LayoutScope" because we might want to have layouts without props */
    initElement = this.useInitElement(mainScope, async (scope: ILocalScope) => {
      const { _Nav, _Footer, _Header } = await scope.scopesGetter;

      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          async () => {
            await _Header;
            return o('<header-main-component>' as never);
          },
          o(
            '<div>',
            {
              className: 'layout--content'
            },
            [
              o(
                '<div>',
                {
                  className: 'row full-height full-width'
                },
                [
                  async () => {
                    await _Nav;
                    return o('<nav-left-main-component>' as never);
                  },
                  o('<router-view-component>', {
                    attributes: {
                      className: 'col'
                    }
                  })
                ]
              )
            ]
          ),
          async () => {
            await _Footer;
            return o('<footer-main-component>' as never);
          },
          async () => {
            return instance.getScopedCss(
              mainScope.applyBreakpoints(await scopedCss)
            );
          }
        ]
      });
    });
  }

  const instance = new mainScope.BaseComponent<ILocalScope>(
    tagName || 'layout-main-component',
    Element
  );

  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
