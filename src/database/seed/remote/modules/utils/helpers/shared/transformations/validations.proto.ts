export const getProtoString = (target: unknown) => {
  return Object.prototype.toString.call(target);
};

const isProtoString = (string: string, val: unknown) => {
  return string === getProtoString(val);
};

type __Object = object;
type _Object<T> = T extends __Object ? T : __Object;
export const isObject = <T>(val: _Object<T> | unknown): val is _Object<T> => {
  return isProtoString('[object Object]', val);
};

type __Promise = Promise<unknown>;
type _Promise<T> = T extends __Promise ? T : __Promise;
export const isPromise = <T>(val: Promise<T> | unknown): val is _Promise<T> => {
  return isProtoString('[object Promise]', val);
};

type __Array = unknown[];
type _Array<T> = T extends __Array ? T : __Array;
export const isArray = <T>(val: _Array<T> | unknown): val is _Array<T> => {
  return isProtoString('[object Array]', val);
};

type __AsyncFunction = (...attrs: unknown[]) => Promise<unknown>;
type _AsyncFunction<T> = T extends __AsyncFunction ? T : __AsyncFunction;
export const isAsyncFunction = <T>(
  val: _AsyncFunction<T> | unknown
): val is _AsyncFunction<T> => {
  return isProtoString('[object AsyncFunction]', val);
};

type __SyncFunction<R = unknown> = (...attrs: unknown[]) => R;
type _SyncFunction<T> = T extends __SyncFunction<infer R>
  ? ReturnType<T> extends R
    ? T
    : __SyncFunction
  : __SyncFunction;
export const isSyncFunction = <T>(
  val: _SyncFunction<T> | unknown
): val is _SyncFunction<T> => {
  return isProtoString('[object Function]', val);
};

type _ObjectOrArray<T> = _SyncFunction<T> | _AsyncFunction<T>;
export const isObjectOrArray = <T>(
  val: T | unknown
): val is _ObjectOrArray<T> => {
  return isArray(val) || isObject(val);
};

type _AsyncOrFunction<T> = _SyncFunction<T> | _AsyncFunction<T>;
export const isAsyncOrFunction = <T>(
  val: _AsyncOrFunction<T> | unknown
): val is _AsyncOrFunction<T> => {
  return isAsyncFunction(val) || isSyncFunction(val);
};
