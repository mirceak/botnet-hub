import type {
  IWCStaticScope,
  IBaseWCScope,
  IWCElement,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IBaseWCScope {
  children: {
    _Header: Promise<IWCStaticScope>;
    _Footer: Promise<IWCStaticScope>;
    _Nav: Promise<IWCStaticScope>;
  };
}

const getComponent = (mainScope: IMainScope, tagName?: string) => {
  const { builder: o } = mainScope.useComponentsObject({
    ['router-view-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/dynamicViews/router/RouterView.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/utils/assets/scss/theme/main/theme.main.scss')
  );

  class Element extends mainScope.BaseHtmlElement implements IWCElement {
    /* *Required here and not in the "LayoutScope" because we might want to have layouts without props */
    initElement = this.useInitElement(mainScope, (scope: ILocalScope) => {
      const { _Nav, _Footer, _Header } = scope.children;

      mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [
          async () => o((await _Header).tagName as never),
          o('<div>', { className: 'layout--content' }, [
            o('<div>', { className: 'row full-height full-width' }, [
              async () => o((await _Nav).tagName as never),
              o('<router-view-component>', async () => ({
                attributes: {
                  className: 'col'
                }
              }))
            ])
          ]),
          async () => o((await _Footer).tagName as never),
          async () =>
            instance.getScopedCss(mainScope.applyBreakpoints(await scopedCss))
        ]
      });
    });
  }

  const instance = new mainScope.BaseWebComponent<ILocalScope>(
    tagName || 'layout-main-component',
    Element
  );

  return instance;
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope, tagName?: string) =>
  singleton ? singleton : (singleton = getComponent(mainScope, tagName));
