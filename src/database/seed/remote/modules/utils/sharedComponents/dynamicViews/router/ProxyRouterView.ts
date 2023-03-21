import type {
  IHTMLElementComponent,
  IMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: IMainScope) => {
  const { _RouterView } = {
    _RouterView: mainScope.asyncComponentScope(
      import(
        '/remoteModules/utils/sharedComponents/dynamicViews/router/RouterView.js'
      )
    )
  };

  class Component
    extends mainScope.HTMLElement
    implements IHTMLElementComponent
  {
    constructor() {
      super();
    }

    async init() {
      await mainScope.asyncLoadComponentTemplate({
        target: this,
        components: [_RouterView]
      });
    }
  }

  return new mainScope.HTMLComponent('proxy-router-view-component', Component);
};

let singleton: ReturnType<typeof getComponent> | undefined;
export default async (mainScope: IMainScope) =>
  singleton ? singleton : (singleton = getComponent(mainScope));
