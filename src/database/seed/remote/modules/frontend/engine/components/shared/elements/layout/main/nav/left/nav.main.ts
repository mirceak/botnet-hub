import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope) => {
  const { o } = mainScope.useComponentsObject();

  const scopedCss = mainScope.asyncStaticFile(
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/layout/main/nav/left/nav.main.scss'
      )
  );

  return mainScope.useComponentRegister(
    'nav-left-main-component',
    (options) => {
      options.useInitElement(() => {
        options.asyncLoadComponentTemplate({
          components: [
            o('<h1>', {
              innerText: () => mainScope.store.data?.home.titleWithName
            }),
            async () => {
              return options.getScopedCss(await scopedCss);
            }
          ]
        });
      });
    }
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
