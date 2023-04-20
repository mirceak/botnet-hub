import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope) => {
  const { o } = mainScope.useComponentsObject();

  const scopedCss = mainScope.asyncStaticFile(
    () =>
      import(
        '/remoteModules/frontend/engine/components/shared/elements/layout/main/header/header.main.scss'
      )
  );

  return mainScope.useComponentRegister('header-main-component', (options) => {
    options.useInitElement(async () => {
      options.asyncLoadComponentTemplate({
        components: [
          o('<h1>', {
            innerText: 'FullStack.js'
          }),
          async () => {
            return options.getScopedCss(await scopedCss);
          }
        ]
      });
    });
  });
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
