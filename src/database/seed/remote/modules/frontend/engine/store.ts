import type { ProxyObject as IProxyObject } from '/remoteModules/utils/reactivity/objectProxy.js';
import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

class StoreModule<State, Modules> {
  __deleteKey?: 'DELETE TO REMOVE THE ENTIRE TREE AND REMOVES ALL PREVIOUS WATCHERS AND SERVED PROXY OBJECTS';
  modules?: Modules;

  state: State;

  constructor(state: State, modules?: Modules) {
    this.state = state;
    this.modules = modules;
  }

  onDestroy = (): void => {
    delete this.__deleteKey;
  };
}

interface HomeModuleState {
  title: string;
  titleWithName?: string;
  nameInput?: string;
}

class State {
  home: HomeModuleState = {
    title: 'Welcome'
  };
}

const useMainModule = <Modules>(modules?: Modules) => {
  const state = new State();
  return new StoreModule<State, Modules>(state, modules) as InstanceType<
    typeof StoreModule<State, Modules>
  > & {
    modules: Modules;
  };
};

const startComputing = (
  storeProxyState: Awaited<ReturnType<typeof useProxyState>>
) => {
  const homeModule = () => storeProxyState.root.state.home;
  const titleWithNameCompute = {
    props: [() => storeProxyState.root.state.home.nameInput],
    computed() {
      const home = homeModule();
      if (home) {
        home.titleWithName = `${home.title || ''}${
          home.nameInput ? ' ' + home.nameInput + '!' : '!'
        }`;
      }
    }
  };

  storeProxyState.registerOnChangeCallback(
    titleWithNameCompute.props,
    titleWithNameCompute.computed.bind(this)
  );

  titleWithNameCompute.computed();
};

export const useProxyState = <Modules>(
  ProxyObject: typeof IProxyObject,
  mainScope: IMainScope,
  modules?: Modules
) => {
  return ProxyObject(useMainModule<Modules>(modules), mainScope);
};

export const useStore = async (
  mainScope: IMainScope,
  ProxyObject: typeof IProxyObject
) => {
  const userModel = await mainScope
    .asyncStaticModule(
      () => import('/remoteModules/services/models/User/model.User.js')
    )
    .then(async ({ getModel }) => {
      return getModel();
    });

  const modules = {
    [userModel.name]: new StoreModule(userModel.data)
  } as const;

  const proxyObject = await useProxyState<typeof modules>(
    ProxyObject,
    mainScope,
    modules
  );

  const { root, registerOnChangeCallback, unRegisterOnChangeCallback } =
    proxyObject;
  startComputing(proxyObject);

  return {
    ...root,
    registerOnChangeCallback: registerOnChangeCallback,
    unRegisterOnChangeCallback: unRegisterOnChangeCallback
  };
};

export type IStore = Awaited<ReturnType<typeof useStore>>;
