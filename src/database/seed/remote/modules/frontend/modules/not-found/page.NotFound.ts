import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope) => {
  return mainScope.useComponentRegister('not-found-component', (options) => {
    options.useInitElement(() => {
      const { o } = mainScope.useComponentsObject();

      options.asyncLoadComponentTemplate({
        components: [
          o('<h1>', {
            innerText: 'Page not found!'
          })
        ]
      });
    });
  });
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
