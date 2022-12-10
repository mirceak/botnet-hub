type IWeakMap = {
  get: CallableFunction;
  has: CallableFunction;
  set: CallableFunction;
  delete: CallableFunction;
};

type IOptions<T> = {
  watchedProxiesMap: T;
  registeringNestedOnChangeCallback: boolean;
  reRegisteringOnChangeCallback: boolean;
  unRegisteringOnChangeCallback: boolean;
  callbackToRegister: CallableFunction | undefined;
  propsCallbackToRegister: CallableFunction[] | undefined;
  registerOnChangeCallback: (
    propsCallbacks: CallableFunction[],
    callback: CallableFunction,
  ) => void;
};

const isObject = (val: unknown) => {
  return (
    ['[object Object]', '[object Array]'].indexOf(
      Object.prototype.toString.call(val),
    ) > -1
  );
};

const registerWatchedProxy = <ProxyMap extends IWeakMap>(
  obj: object,
  prop: symbol,
  options: IOptions<ProxyMap>,
) => {
  let watchers = options.watchedProxiesMap.get(obj);
  if (!watchers) {
    if (options.unRegisteringOnChangeCallback) {
      return;
    }
    options.watchedProxiesMap.set(obj, (watchers = new Map()));
  }

  let callbacks = watchers.get(prop);
  if (!callbacks) {
    if (options.unRegisteringOnChangeCallback) {
      return;
    }
    watchers.set(prop, (callbacks = [new Set(), new Set(), new Set()]));
  }

  if (options.unRegisteringOnChangeCallback) {
    callbacks[0].delete(options.propsCallbackToRegister);
    return callbacks[1].delete(options.callbackToRegister);
  }
  callbacks[0].add(options.propsCallbackToRegister);
  callbacks[1].add(options.callbackToRegister);
};

const triggerWatchers = <ProxyMap extends IWeakMap>(
  obj: object,
  prop: symbol,
  options: IOptions<ProxyMap>,
) => {
  const watchers = options.watchedProxiesMap.get(obj);
  if (watchers) {
    const callbacksPacks = watchers.get(prop);

    if (callbacksPacks) {
      const [_propCallbacks, _callbacks] = callbacksPacks;
      const propCallbacks = [..._propCallbacks];
      const callbacks = [..._callbacks];
      for (let i = 0; i < callbacks.length; i++) {
        if (options.reRegisteringOnChangeCallback) {
          options.registerOnChangeCallback(propCallbacks[i], callbacks[i]);
        } else {
          callbacks[i]();
        }
      }
    }
  }
};
const handler = <
  ObjectType extends Record<symbol, ObjectType>,
  ProxyMap extends IWeakMap,
  Parent extends Record<string, Parent>,
>(
  options: IOptions<ProxyMap>,
  _parent: Parent & ObjectType,
  _thisProp: string | 'root',
) => ({
  _proxySet: new Map(),
  _thisProp,
  _parent,
  get(obj: ObjectType, prop: symbol, receiver: unknown): unknown {
    if (isObject(obj[prop])) {
      if (!this._proxySet.has(prop)) {
        Reflect.set(
          obj,
          prop,
          new Proxy(
            obj[prop],
            handler(options, this, prop as unknown as string),
          ),
          receiver,
        );
        this._proxySet.set(prop, obj[prop]);
      }
      return this._proxySet.get(prop);
    }

    if (options.callbackToRegister) {
      registerWatchedProxy(this, prop, options);
      if (!options.registeringNestedOnChangeCallback) {
        options.registeringNestedOnChangeCallback = true;
        let parent = this._parent;
        while (parent) {
          if (parent._parent) {
            (parent._parent as unknown as Record<'get', CallableFunction>).get(
              parent._parent,
              parent._thisProp as unknown as keyof typeof parent._parent,
            );
          }
          parent = parent._parent as typeof parent;
        }
        options.registeringNestedOnChangeCallback = false;
      }
    }

    return Reflect.get(obj, prop, receiver);
  },
  set(obj: ObjectType, prop: symbol, value: ObjectType, receiver: unknown) {
    if (isObject(value)) {
      /* keep all previous references alive. removing this would replace references to existing variables invalidating existing watchers using external variables to reference the tree*/
      if (this._proxySet.has(prop)) {
        if (obj[prop]) {
          /* we are replacing the existing values of the proxy tree we're currently on*/
          Object.assign(obj[prop], value);
        } else {
          /* the object was probably deleted and reassigned and we're creating a new proxy tree but keeping the old one alive to keep the pre-existing references alive */
          Reflect.set(obj, prop, value, receiver);
        }
      } else {
        Reflect.set(
          obj,
          prop,
          new Proxy(value, handler(options, this, prop as unknown as string)),
          receiver,
        );
        this._proxySet.set(prop, obj[prop]);
      }
      options.reRegisteringOnChangeCallback = true;
    } else {
      Reflect.set(obj, prop, value, receiver);
    }

    if (options.watchedProxiesMap.get(this)) {
      triggerWatchers(this, prop, options);
      options.reRegisteringOnChangeCallback = false;
    }

    return true;
  },
  deleteProperty(obj: ObjectType, prop: symbol) {
    /* this removes references to existing variables invalidating existing watchers using external variables to reference the tree */
    if (prop.toString() === '__removeTree') {
      if (
        (
          this._parent._proxySet as unknown as Record<'has', CallableFunction>
        ).has(this._thisProp)
      ) {
        (
          this._parent._proxySet as unknown as Record<
            'delete',
            CallableFunction
          >
        ).delete(this._thisProp);
      }
      Reflect.deleteProperty(this._parent, this._thisProp);
    } else {
      Reflect.deleteProperty(obj, prop);
    }
    if (options.watchedProxiesMap.get(this)) {
      triggerWatchers(this, prop, options);
    }
    return true;
  },
});
export const ProxyObject = <ObjectState>(obj: ObjectState) => {
  const options = {
    watchedProxiesMap: new WeakMap(),
    registeringNestedOnChangeCallback: false,
    unRegisteringOnChangeCallback: false,
    reRegisteringOnChangeCallback: false,
    callbackToRegister: undefined as CallableFunction | undefined,
    propsCallbackToRegister: undefined as CallableFunction[] | undefined,
    registerOnChangeCallback(
      propsCallbacks: CallableFunction[],
      callback: CallableFunction,
    ) {
      options.callbackToRegister = callback;
      options.propsCallbackToRegister = propsCallbacks;
      Object.values(propsCallbacks).forEach((prop) => prop());
      options.callbackToRegister = undefined;
      options.propsCallbackToRegister = undefined;
    },
    unRegisterOnChangeCallback(
      propsCallbacks: CallableFunction[],
      callback: CallableFunction,
    ) {
      options.unRegisteringOnChangeCallback = true;
      options.callbackToRegister = callback;
      options.propsCallbackToRegister = propsCallbacks;
      Object.values(propsCallbacks).forEach((prop) => prop());
      options.callbackToRegister = undefined;
      options.propsCallbackToRegister = undefined;
      options.unRegisteringOnChangeCallback = false;
    },
  };
  return {
    data: new Proxy(obj, handler(options, undefined, 'root')) as ObjectState,
    registerOnChangeCallback: options.registerOnChangeCallback,
    unRegisterOnChangeCallback: options.unRegisterOnChangeCallback,
  };
};
