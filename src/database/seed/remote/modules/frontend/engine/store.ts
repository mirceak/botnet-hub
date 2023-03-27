import type {
  ExternalNested,
  ProxyObject as IProxyObject
} from '/remoteModules/utils/reactivity/objectProxy.js';
import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

interface HomeModuleState {
  title?: string;
  titleWithName?: string;
  nameInput?: string;
  asd: {
    tsa: number;
  };
}

class State {
  home: HomeModuleState = {
    title: 'Welcome',
    asd: {
      tsa: 333
    }
  };
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
  startComputing(proxyObject);
  return {
    data: proxyObject.data as ExternalNested<State>,
    registerOnChangeCallback: proxyObject.registerOnChangeCallback,
    unRegisterOnChangeCallback: proxyObject.unRegisterOnChangeCallback,
    onDestroy() {
      const store = proxyObject as Partial<typeof proxyObject>;
      delete store.data?.__removeTree;
      delete store.data;
    }
  };
};

export type IStore = Awaited<ReturnType<typeof useStore>>;
