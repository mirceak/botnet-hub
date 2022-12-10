const { ProxyObject } = await import(
  '@remoteModules/utils/reactivity/objectProxy.js'
);

const useState = () => ({
  modules: {
    home: {
      title: 'Welcome',
      titleWithName: null as string | null,
      nameInput: null as string | null,
    },
  },
});

const startComputing = (storeProxyState: IStoreProxyState) => {
  let count = 0;
  const homeModule = storeProxyState.data.modules.home;
  const titleWithNameCompute = {
    props: [() => homeModule.title, () => homeModule.nameInput],
    computed() {
      homeModule.titleWithName =
        homeModule.title +
        ' ' +
        (homeModule.nameInput ? homeModule.nameInput + '!' + count : '');
    },
  };
  setInterval(() => {
    count++;
    if (count === 3) {
      storeProxyState.unRegisterOnChangeCallback(
        titleWithNameCompute.props,
        titleWithNameCompute.computed,
      );
    }
  }, 1000);
  storeProxyState.registerOnChangeCallback(
    titleWithNameCompute.props,
    titleWithNameCompute.computed,
  );

  titleWithNameCompute.computed();
};

export const useProxyState = () => {
  return ProxyObject(useState());
};

export const useStore = () => {
  const proxyObject = useProxyState();
  startComputing(proxyObject);
  return {
    ...proxyObject,
    componentScopes: new WeakMap(),
  };
};

export type IStore = ReturnType<typeof useStore>;
export type IStoreProxyState = ReturnType<typeof useProxyState>;
