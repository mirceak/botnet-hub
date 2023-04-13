import type { ProxyObject as IProxyObject } from '/remoteModules/utils/reactivity/objectProxy.js';
import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

class StoreModule<State, ParentState> {
  __deleteKey?: 'DELETE TO REMOVE THE ENTIRE TREE AND REMOVES ALL PREVIOUS WATCHERS AND SERVED PROXY OBJECTS';
  modules: Record<symbol | string | number, StoreModule<unknown, State>> =
    {} as Record<symbol | string | number, StoreModule<unknown, State>>;
  parent?: StoreModule<ParentState, undefined>;

  data: State;

  constructor(state: State) {
    this.data = state;
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

const useMainModule = () => {
  const state = new State();
  return new StoreModule(state);
};

const startComputing = (
  storeProxyState: Awaited<ReturnType<typeof useProxyState>>
) => {
  const homeModule = () => storeProxyState.state.data?.home;
  const titleWithNameCompute = {
    props: [() => storeProxyState.state.data?.home?.nameInput],
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

export const useProxyState = (
  ProxyObject: typeof IProxyObject,
  mainScope: IMainScope
): ReturnType<typeof IProxyObject<ReturnType<typeof useMainModule>>> => {
  return ProxyObject(useMainModule(), mainScope);
};

export const useStore = async (mainScope: IMainScope) => {
  const { ProxyObject } = await mainScope.asyncStaticModule(
    () => import('/remoteModules/utils/reactivity/objectProxy.js')
  );
  const proxyObject = await useProxyState(ProxyObject, mainScope);
  const { state, registerOnChangeCallback, unRegisterOnChangeCallback } =
    proxyObject;
  startComputing(proxyObject);

  const _registerDynamicModule = async <ModuleState, ParentState>(
    moduleState: ModuleState,
    key?: symbol | string | number,
    parent?: ParentState
  ) => {
    key =
      typeof key === 'string'
        ? key
        : typeof key === 'number'
        ? key
        : Symbol('');

    const newModuleComposer = {
      ...new StoreModule(moduleState),
      key,
      parent,
      registerDynamicModule<_ModuleState, _ParentState>(
        _moduleState: _ModuleState,
        _key?: symbol | string | number
      ) {
        return _registerDynamicModule<_ModuleState, _ParentState>(
          _moduleState,
          _key,
          parent as _ParentState
        );
      },
      registerOnChangeCallback: registerOnChangeCallback,
      unRegisterOnChangeCallback: unRegisterOnChangeCallback
    };

    if (parent) {
      const parentModules = (
        parent as Partial<
          InstanceType<typeof StoreModule<ParentState, unknown>>
        >
      ).modules;
      if (parentModules && newModuleComposer) {
        parentModules[key] = newModuleComposer as InstanceType<
          typeof StoreModule<ModuleState, unknown>
        >;
      }
    }

    return newModuleComposer;
  };

  return {
    ...state,
    registerOnChangeCallback: registerOnChangeCallback,
    unRegisterOnChangeCallback: unRegisterOnChangeCallback,
    registerDynamicModule<__ModuleState>(
      moduleState: __ModuleState,
      key?: symbol | string | number
    ) {
      return _registerDynamicModule<__ModuleState, typeof state>(
        moduleState,
        key,
        state
      );
    }
  };
};

export type IStore = Awaited<ReturnType<typeof useStore>>;
