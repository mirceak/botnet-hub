export const isObjectOrArray = (val: unknown) => {
  return (
    ['[object Object]', '[object Array]'].indexOf(
      Object.prototype.toString.call(val)
    ) > -1
  );
};

export const isObject = (val: unknown) => {
  return ['[object Object]'].indexOf(Object.prototype.toString.call(val)) > -1;
};

export const isArray = (val: unknown) => {
  return ['[object Array]'].indexOf(Object.prototype.toString.call(val)) > -1;
};

export const isFunctionOrAsyncFunction = (val: unknown) => {
  return (
    ['[object Function]', '[object AsyncFunction]'].indexOf(
      Object.prototype.toString.call(val)
    ) > -1
  );
};

export const isAsyncFunction = (val: unknown) => {
  return (
    ['[object AsyncFunction]'].indexOf(Object.prototype.toString.call(val)) > -1
  );
};

export const isFunction = (val: unknown) => {
  return (
    ['[object Function]'].indexOf(Object.prototype.toString.call(val)) > -1
  );
};
