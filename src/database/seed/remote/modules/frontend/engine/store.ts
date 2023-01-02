import type { ProxyObject as IProxyObject } from '@remoteModules/utils/reactivity/objectProxy.js';
import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

interface HomeModuleState {
  title?: string;
  titleWithName?: string;
  nameInput?: string;
}

class State {
  home: HomeModuleState = {
    title: 'Welcome',
  };
}

const useState = () => new State();

const startComputing = (storeProxyState: ReturnType<typeof useProxyState>) => {
  const homeModule = () => storeProxyState.data.home;
  const titleWithNameCompute = {
    props: [() => storeProxyState.data.home?.nameInput],
    computed() {
      const home = homeModule();
      if (home) {
        home.titleWithName =
          home.title + (home.nameInput ? ' ' + home.nameInput + '!' : '!');
      }
    },
  };
  storeProxyState.registerOnChangeCallback(
    titleWithNameCompute.props,
    titleWithNameCompute.computed,
  );

  titleWithNameCompute.computed();
};

export const useProxyState = (
  ProxyObject: typeof IProxyObject,
): ReturnType<typeof IProxyObject<ReturnType<typeof useState>>> => {
  return ProxyObject(useState());
};

export const useStore = async (mainScope: IHTMLElementsScope) => {
  const { ProxyObject } = await mainScope.loadModule(
    () => import('@remoteModules/utils/reactivity/objectProxy.js'),
  );
  const proxyObject = await useProxyState(ProxyObject);
  startComputing(proxyObject);
  return {
    data: proxyObject.data,
    registerOnChangeCallback: proxyObject.registerOnChangeCallback,
    unRegisterOnChangeCallback: proxyObject.unRegisterOnChangeCallback,
    onDestroy() {
      const store = proxyObject as Partial<typeof proxyObject>;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete store.data.home.__removeTree;
      delete store.data;
    },
  };
};

export type IStore = Parameters<
  NonNullable<Parameters<ReturnType<typeof useStore>['then']>[0]>
>[0];