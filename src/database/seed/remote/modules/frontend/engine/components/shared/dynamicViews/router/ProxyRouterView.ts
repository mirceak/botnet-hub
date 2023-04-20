import type {
  IMainScope,
  IWCExtendingBaseElementScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = (mainScope: IMainScope) => {
  const { o } = mainScope.useComponentsObject({
    ['router-view-component']: () =>
      import(
        '/remoteModules/frontend/engine/components/shared/dynamicViews/router/RouterView.js'
      )
  });

  return mainScope.useComponentRegister<IWCExtendingBaseElementScope>(
    'proxy-router-view-component',
    (options) => {
      options.useInitElement((scope) => {
        options.asyncLoadComponentTemplate({
          components: [
            o('<router-view-component>', {
              attributes: scope?.elementAttributes
            })
          ]
        });
      });
    }
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
