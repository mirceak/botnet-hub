import type {
  IWCStaticScope,
  IWCBaseScope,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

interface ILocalScope extends IWCBaseScope<HTMLElement> {
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
            async () => {
              const Header = await _Header;
              return o(Header.tagName as never, Header as never);
            },
            o('<div>', { className: 'layout--content' }, [
              o('<div>', { className: 'row full-height full-width' }, [
                async () => {
                  const Nav = await _Nav;
                  return o(Nav.tagName as never, Nav as never);
                },
                o('<router-view-component>', {
                  attributes: {
                    className: 'col'
                  }
                })
              ])
            ]),
            async () => {
              const Footer = await _Footer;
              return o(Footer.tagName as never, Footer as never);
            },
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
