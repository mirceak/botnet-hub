import type {
  IHTMLElementComponent,
  TMainScope
} from '/remoteModules/frontend/engine/components/Main.js';

const getComponent = async (mainScope: TMainScope) => {
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

export default async (mainScope: TMainScope) => getComponent(mainScope);
