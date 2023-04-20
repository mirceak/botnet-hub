import type {
  IWCExtendingBaseElementScope,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

type ILocalButtonScope = IWCExtendingBaseElementScope<HTMLButtonElement>;

const getComponent = async (mainScope: IMainScope) => {
  const { o } = mainScope.useComponentsObject();

  return mainScope.useComponentRegister<ILocalButtonScope, HTMLButtonElement>(
    'button-component',
    (options) => {
      options.useInitElement((scope) => {
        /* TODO: add wc-if directives */
        const buttonTemplate = o('<button>', scope?.elementAttributes);
        options.asyncLoadComponentTemplate({
          components: [buttonTemplate]
        });
      });
    }
  );
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
