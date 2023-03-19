declare global {
  interface Window {
    loadModule: <T>(importer: () => Promise<T>) => Promise<T>;
    pathname?: string;
  }
}
export {};
