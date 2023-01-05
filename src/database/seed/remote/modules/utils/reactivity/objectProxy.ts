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
  callbackToRegister?: CallableFunction;
  propsCallbackToRegister?: CallableFunction[];
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

  let callbacksPacks = watchers.get(prop);
  if (!callbacksPacks) {
    if (options.unRegisteringOnChangeCallback) {
      return;
    }
    watchers.set(prop, (callbacksPacks = [new Set(), new Set()]));
  }

  if (options.unRegisteringOnChangeCallback) {
    callbacksPacks[0].delete(options.propsCallbackToRegister);
    return callbacksPacks[1].delete(options.callbackToRegister);
  }
  callbacksPacks[0].add(options.propsCallbackToRegister);
  callbacksPacks[1].add(options.callbackToRegister);
  if (
    options.propsCallbackToRegister &&
    Object.keys(options.propsCallbackToRegister).indexOf('_oldValues') === -1
  ) {
    /* Must keep the same reference to the old values across the tree, so we disable watchers and get the values. */
    /* Results will be the same, so we don't worry about triggering older watchers. */
    const values = [] as unknown[];
    const oldPropsCallbackToRegister = options.propsCallbackToRegister;
    const callbackToRegister = options.callbackToRegister;
    options.propsCallbackToRegister = undefined;
    options.callbackToRegister = undefined;
    Object.keys(oldPropsCallbackToRegister).forEach((key) => {
      if (!isNaN(+key)) values.push(oldPropsCallbackToRegister[+key]());
    });
    (
      oldPropsCallbackToRegister as unknown as Record<string, unknown>
    )._oldValues = values;
    options.propsCallbackToRegister = oldPropsCallbackToRegister;
    options.callbackToRegister = callbackToRegister;
  }
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
        }
        let foundChange = false;
        const newValues = [] as unknown[];
        Object.keys(propCallbacks[i]).forEach((key, index) => {
          if (!isNaN(+key)) {
            const newValue = propCallbacks[i][key]();
            if (newValue !== propCallbacks[i]['_oldValues'][index]) {
              foundChange = true;
            }
            newValues.push(newValue);
          }
        });
        if (foundChange) {
          propCallbacks[i]._oldValues.splice(
            0,
            propCallbacks[i]._oldValues.length,
            ...newValues,
          );
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
      if (options.callbackToRegister) {
        registerWatchedProxy(this, prop, options);
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
      /* keep all previous references alive. removing this would replace references to existing variables invalidating existing watchers using external variables to reference the tree */
      if (this._proxySet.has(prop)) {
        if (obj[prop] != null) {
          /* we are replacing the existing values of the proxy tree we're currently on*/
          Object.assign(obj[prop], value);
        } else {
          /* the object deleted and reassigned, and we're creating a new proxy tree but keeping the old one alive to keep the pre-existing references alive */
          Reflect.set(obj, prop, value, receiver);
          this._proxySet.set(
            prop,
            new Proxy(value, handler(options, this, prop as unknown as string)),
          );
        }
      } else {
        /* we're assigning a new proxy entirely or the previous value was removed using the ".__removeTree" property having all existing proxies removed */
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
    }

    options.reRegisteringOnChangeCallback = false;

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

/*If an object's structure is like a two-dimensional tree, a ProxyObject's structure is like a three-dimensional tree where it's main structure mirrors the original object's and some branches have depth because we need multiple instances of the same structures.*/
/*The ProxyObject is built dynamically whenever it is accessed. This means that it does not initially have the original object's structure but that it is also limited by it.*/
/*Whenever a branch of the tree is reassigned (a nested property that is an object) the ProxyObject will keep it's old branch and just update the values to reflect the changes. This is done to prevent references to the tree being lost.*/
/*Whenever a branch of the tree is removed (a nested property that is an object) the ProxyObject's branch will still exist because we still have references that watch the old branch instance. If the branch gets reassigned a new value, a new ProxyObject branch will get created but the old one will still exist as ghost branches.*/
/*Ghost branches (duplicated branches) can be removed by unregistering the watchers that referenced them*/
export const ProxyObject = <T>(obj: T) => {
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
      Object.keys(propsCallbacks).forEach((key) => {
        if (!isNaN(+key)) propsCallbacks[+key]();
      });
      options.callbackToRegister = undefined;
      options.propsCallbackToRegister = undefined;
    },
    unRegisterOnChangeCallback(
      propsCallbacks: CallableFunction[],
      callback: CallableFunction,
    ) {
      options.unRegisteringOnChangeCallback = true;
      this.registerOnChangeCallback(propsCallbacks, callback);
      options.unRegisteringOnChangeCallback = false;
    },
  };
  return {
    /*need to make this entire object a proxy and protect data from deletion as well as make sure new entries */
    data: new Proxy(obj, handler(options, undefined, 'root')) as T,
    registerOnChangeCallback: options.registerOnChangeCallback,
    unRegisterOnChangeCallback: options.unRegisterOnChangeCallback,
  };
};
