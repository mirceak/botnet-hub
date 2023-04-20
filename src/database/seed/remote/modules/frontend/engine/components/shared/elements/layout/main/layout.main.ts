import type {
  IWCStaticScope,
  IWCBaseScope,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IWCBaseScope {
  children: {
    _Header: Promise<IWCStaticScope>;
    _Footer: Promise<IWCStaticScope>;
    _Nav: Promise<IWCStaticScope>;
  };
}

const getComponent = (mainScope: IMainScope) => {
  const { o } = mainScope.useComponentsObject({
    ['router-view-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/dynamicViews/router/RouterView.js'
      )
  });

  const scopedCss = mainScope.asyncStaticFile(
    () => import('/remoteModules/utils/assets/scss/theme/main/theme.main.scss')
  );

  return mainScope.useComponentRegister<ILocalScope>(
    'layout-main-component',
    (options) => {
      options.useInitElement((scope) => {
        const { _Nav, _Footer, _Header } = scope.children;

        options.asyncLoadComponentTemplate({
          components: [
            async () => o((await _Header).tagName as never),
            o('<div>', { className: 'layout--content' }, [
              o('<div>', { className: 'row full-height full-width' }, [
                async () => o((await _Nav).tagName as never),
                o('<router-view-component>', {
                  attributes: {
                    className: 'col'
                  }
                })
              ])
            ]),
            async () => o((await _Footer).tagName as never),
            async () =>
              options.getScopedCss(mainScope.applyBreakpoints(await scopedCss))
          ]
        });
      });
    }
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
