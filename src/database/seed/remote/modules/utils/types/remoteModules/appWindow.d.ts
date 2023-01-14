declare global {
  interface Window {
    loadModule: <T>(importer: () => Promise<T>) => Promise<T>;
    SSR: boolean;
    _shouldHydrate: boolean;
    pathname?: string;
    onHTMLReady?: CallableFunction;
  }
}
export {};
