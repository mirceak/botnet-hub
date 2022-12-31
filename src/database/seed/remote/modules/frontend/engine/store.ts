import type { ProxyObject as IProxyObject } from '@remoteModules/utils/reactivity/objectProxy.js';
import type { Router } from '@remoteModules/frontend/engine/router.js';
import type { IHTMLElementsScope } from '@remoteModules/frontend/engine/components/Main.js';

interface HomeModuleState {
  title?: string;
  titleWithName?: string;
  nameInput?: string;
}

class State {
  router?: Router;
  home: HomeModuleState = {
    title: 'Welcome',
  };
}

const useState = () => new State();

const startComputing = (storeProxyState: ReturnType<typeof useProxyState>) => {
  // let count = 0;
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
  // setInterval(() => {
  //   count++;
  //   if (count === 3) {
  //     storeProxyState.unRegisterOnChangeCallback(
  //       titleWithNameCompute.props,
  //       titleWithNameCompute.computed,
  //     );
  //   }
  // }, 1000);
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
  };
};

export type IStore = Parameters<
  NonNullable<Parameters<ReturnType<typeof useStore>['then']>[0]>
>[0];
