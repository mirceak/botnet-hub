import type {
  IMainScope,
  IWCExtendingBaseElementScope
} from '/remoteModules/frontend/engine/components/Main.js';

type ILocalScope = IWCExtendingBaseElementScope<HTMLInputElement>;

const getComponent = async (mainScope: IMainScope) => {
  const { o } = mainScope.useComponentsObject();

  return mainScope.useComponentRegister<HTMLInputElement, ILocalScope>(
    'select-input-component',
    (options) => {
      options.useInitElement((scope) => {
        const selectTemplate = o('<input>', scope?.elementAttributes);

        options.asyncLoadComponentTemplate({
          components: [selectTemplate]
        });
      });
    }
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
