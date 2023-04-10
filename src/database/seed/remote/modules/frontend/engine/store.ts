import type { ProxyObject as IProxyObject } from '/remoteModules/utils/reactivity/objectProxy.js';
import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

type NestedUnknown = {
  [Key: string]: string | symbol | number | boolean | NestedUnknown;
};

interface StoreModule<State> {
  data?: State;
  modules?: Record<symbol | string | number, DynamicStoreModule<State>>;
  __deleteKey?: 'DELETE THIS PROPERTY TO DELETE THE ENTIRE TREE AND REMOVES ALL PREVIOUS WATCHERS AND REFERENCES';
}

/* TODO: add option to access store data without the reactivity layer maybe enter the same tree through a different key like 'nonReactive' at the root of every module. */
interface DynamicStoreModule<State> extends StoreModule<State> {
  destroy: () => void;
}

interface HomeModuleState {
  title?: string;
  titleWithName?: string;
  nameInput?: string;
}
class State implements StoreModule<NestedUnknown> {
  modules: Record<
    symbol | string | number,
    DynamicStoreModule<NestedUnknown>
  > extends Record<symbol | string | number, DynamicStoreModule<infer State>>
    ? Record<symbol | string | number, DynamicStoreModule<State>>
    : never = {};
  home: HomeModuleState = {
    title: 'Welcome'
  };
  __deleteKey?: 'DELETE THIS PROPERTY TO DELETE THE ENTIRE TREE AND REMOVES ALL PREVIOUS WATCHERS AND REFERENCES';
}

const useState = () => new State();

const startComputing = (
  storeProxyState: Awaited<ReturnType<typeof useProxyState>>
) => {
  const homeModule = () => storeProxyState.data.home;
  const titleWithNameCompute = {
    props: [() => storeProxyState.data.home?.nameInput],
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
): ReturnType<typeof IProxyObject<ReturnType<typeof useState>>> => {
  return ProxyObject(useState(), mainScope);
};

export const useStore = async (mainScope: IMainScope) => {
  const { ProxyObject } = await mainScope.asyncStaticModule(
    () => import('/remoteModules/utils/reactivity/objectProxy.js')
  );
  const proxyObject = await useProxyState(ProxyObject, mainScope);
  const { data, registerOnChangeCallback, unRegisterOnChangeCallback } =
    proxyObject;
  startComputing(proxyObject);

  const registerDynamicModule = <ModuleState>(
    moduleState: StoreModule<NestedUnknown & ModuleState>,
    key?: symbol | string | number
  ) => {
    key =
      typeof key === 'string'
        ? key
        : typeof key === 'number'
        ? key
        : Symbol('');

    data.modules[key] = {
      data: moduleState.data,
      modules: moduleState.modules,
      destroy: () => {
        delete moduleState.__deleteKey;
      }
    };
    return {
      key,
      registerDynamicModule,
      modules: data.modules[key].modules,
      data: data.modules[key].data,
      destroy: data.modules[key].destroy,
      registerOnChangeCallback: registerOnChangeCallback,
      unRegisterOnChangeCallback: unRegisterOnChangeCallback
    };
  };

  return {
    data: data,
    registerOnChangeCallback: registerOnChangeCallback,
    unRegisterOnChangeCallback: unRegisterOnChangeCallback,
    registerDynamicModule,
    onDestroy() {
      delete proxyObject.data?.__deleteKey;
    }
  };
};

export type IStore = Awaited<ReturnType<typeof useStore>>;
