import type {
  IMainScope,
  IWCBaseScope
} from '/remoteModules/frontend/engine/components/Main.js';

type ILocalScope = IWCBaseScope<HTMLElement> & {
  elementAttributes?: IWCBaseScope<HTMLButtonElement>['attributes'];
};

const getComponent = async (mainScope: IMainScope) => {
  const { o } = mainScope.useComponentsObject();

  return mainScope.useComponentRegister<ILocalScope>(
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
