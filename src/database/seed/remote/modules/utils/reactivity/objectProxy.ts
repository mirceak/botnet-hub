import type { IMainScope } from '/remoteModules/frontend/engine/components/Main.js';

type IOptions<T = InstanceType<typeof WeakMap>> = {
  mainScope: IMainScope;
  watchedProxiesMap: T;
  registeringNestedOnChangeCallback: boolean;
  reRegisteringOnChangeCallback: boolean;
  unRegisteringOnChangeCallback: boolean;
  callbackToRegister?: CallableFunction;
  propsCallbackToRegister?: CallableFunction[];
  registerOnChangeCallback: (
    propsCallbacks: CallableFunction[],
    callback: CallableFunction
  ) => void;
};

type Nested<T> = T & Record<string, T>;

type ProxyInternalProps<T> = Nested<
  T & {
    _proxySet: InstanceType<typeof Map<string, T>> & T;
    _thisProp: string;
    _parent?: T & Nested<ProxyInternalProps<T>>;

    get: (prop: string) => void /* used to trigger watching */;
  }
>;

const registerWatchedProxy = <ProxyMap extends InstanceType<typeof WeakMap>>(
  obj: object,
  prop: string,
  options: IOptions<ProxyMap>
) => {
  let watchers = options.watchedProxiesMap.get(obj) as Map<
    typeof prop,
    typeof obj
  >;
  if (!watchers) {
    if (options.unRegisteringOnChangeCallback) {
      return;
    }
    options.watchedProxiesMap.set(obj, (watchers = new Map()));
  }

  let callbacksPacks = watchers.get(prop) as [Set<unknown>, Set<unknown>];
  if (!callbacksPacks) {
    if (options.unRegisteringOnChangeCallback) {
      return;
    }
    watchers.set(prop, (callbacksPacks = [new Set(), new Set()]));
  }

  if (options.unRegisteringOnChangeCallback) {
    callbacksPacks[0].delete(options.propsCallbackToRegister);
    callbacksPacks[1].delete(options.callbackToRegister);
    return;
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

const triggerWatchers = <ProxyMap extends InstanceType<typeof WeakMap>>(
  obj: object,
  prop: string,
  options: IOptions<ProxyMap>
) => {
  const watchers = options.watchedProxiesMap.get(obj) as Map<
    typeof prop,
    [Array<Record<string | number, () => unknown>>, []]
  >;
  if (watchers) {
    const callbacksPacks = watchers.get(prop);

    if (callbacksPacks) {
      const [_propCallbacks, _callbacks] = callbacksPacks;
      const propCallbacks = [..._propCallbacks];
      const callbacks = [..._callbacks];
      for (let i = 0; i < callbacks.length; i++) {
        if (propCallbacks[i]) {
          if (options.reRegisteringOnChangeCallback) {
            options.registerOnChangeCallback(
              propCallbacks[i] as unknown as CallableFunction[],
              callbacks[i]
            );
          }
          const newValues = [] as unknown[];
          let foundChange = false;
          Object.keys(propCallbacks[i]).forEach((key, index) => {
            if (!isNaN(+key) && typeof +key === 'number') {
              const newValue = propCallbacks[i][+key]();
              const oldValue = (
                propCallbacks[i]['_oldValues'] as unknown as Record<
                  string | number,
                  () => unknown
                >
              )[index] as unknown;
              if (newValue !== oldValue) {
                foundChange = true;
              }
              newValues.push(newValue);
            }
          });
          if (foundChange) {
            (
              propCallbacks[i]['_oldValues'] as unknown as Array<unknown>
            ).splice(0, propCallbacks[i]['_oldValues'].length, ...newValues);
            (callbacks[i] as CallableFunction)();
          }
        }
      }
    }
  }
};

const handler = <ObjectType>(
  options: IOptions,
  _parent: undefined | ProxyInternalProps<ObjectType>,
  _thisProp: string | 'root'
) => ({
  _proxySet: new Map(),
  _thisProp,
  _parent,
  get(
    obj: ProxyInternalProps<ObjectType>,
    prop: string,
    receiver: ProxyInternalProps<ObjectType>
  ) {
    if (options.mainScope.helpers.validationsProto.isObjectOrArray(obj[prop])) {
      if (!this._proxySet.has(prop)) {
        Reflect.set(
          obj,
          prop,
          new Proxy(obj[prop], handler(options, this as never, prop)),
          receiver
        );
        this._proxySet.set(prop, obj[prop]);
      }
      if (options.callbackToRegister) {
        registerWatchedProxy(this, prop, options);
      }
      return this._proxySet.get(prop);
    }

    if (options.callbackToRegister || !(prop === undefined)) {
      if (prop !== undefined) {
        registerWatchedProxy(this, prop, options);
      }
      if (!options.registeringNestedOnChangeCallback) {
        options.registeringNestedOnChangeCallback = true;
        let parent = this._parent;
        while (parent) {
          if (parent._parent) {
            parent._parent.get(parent._thisProp);
          }
          parent = parent._parent;
        }
        options.registeringNestedOnChangeCallback = false;
      }
    }

    if (prop === undefined) {
      return undefined;
    }

    return Reflect.get(obj, prop, receiver);

    /* 
      TODO: add option to access store mainModule without the reactivity layer, maybe enter the same tree through a different key like 'nonReactive' at the root of every module.
    */
    /* TODO: this should return a proxy to enable base type values to be transferred directly removing the need to either explicitly call the path or parent object when registering watchers */
    /* This proxy should should remember it's value and this should be returned when the value is accessed */
    /* This also means that you cannot delete the proxies anymore, removing ghost trees so setting the value would happen in the same proxy all the time */
    /* Deleting a base type proxy would only clear out it's value and this way, resigning a value after deleting it will just update the empty proxy's value */
    /* Add composable that returns an empty object strong typed with the structure it represented for edit forms */
  },
  set(
    obj: ProxyInternalProps<ObjectType>,
    prop: string,
    value: unknown,
    receiver: ProxyInternalProps<ObjectType>
  ) {
    if (options.mainScope.helpers.validationsProto.isObjectOrArray(value)) {
      /* keep all previous references alive. removing this would replace references to existing variables invalidating existing watchers using external variables to reference the tree */
      if (this._proxySet.has(prop)) {
        if (obj[prop] != null) {
          /* we are replacing the existing values of the proxy tree we're currently on*/
          Object.assign(obj[prop], value);
        } else {
          /* the object got deleted and reassigned, and we're creating a new proxy tree but keeping the old one alive to keep the pre-existing references alive */
          Reflect.set(obj, prop, value, receiver);
          this._proxySet.set(
            prop,
            new Proxy(
              value as ProxyInternalProps<ObjectType>,
              handler(options, this as never, prop)
            )
          );
        }
      } else {
        /* we're assigning a new proxy entirely or the previous value was removed using the ".__deleteKey" property having all existing proxies removed */
        Reflect.set(
          obj,
          prop,
          new Proxy(
            value as ProxyInternalProps<ObjectType>,
            handler(options, this as never, prop)
          ),
          receiver
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
  deleteProperty(obj: ProxyInternalProps<ObjectType>, prop: string) {
    /* this removes references to existing variables invalidating existing watchers using external variables to reference the tree */
    if (`${prop}` === '__deleteKey') {
      if (this._parent) {
        if (this._parent._proxySet.has(this._thisProp)) {
          this._parent._proxySet.delete(this._thisProp);
          Reflect.deleteProperty(this._parent, this._thisProp);
        }
      }
    }

    Reflect.deleteProperty(obj, prop);
    if (options.watchedProxiesMap.get(this)) {
      triggerWatchers(this, prop, options);
    }
    return true;
  }
});

/*If an object's structure is like a two-dimensional tree, a Proxy's structure is like a three-dimensional tree where it's main structure mirrors the original object's and some branches have depth because we need multiple instances of the same structures.*/
/*The ProxyInternalProps is built dynamically whenever it is accessed. This means that it does not initially have the original object's structure but that it is also limited by it.*/
/*Whenever a branch of the tree is reassigned (a nested property that is an object) the Proxy will keep it's old branch and just update the values to reflect the changes. This is done to prevent references to the tree being lost.*/
/*Whenever a branch of the tree is removed (a nested property that is an object) the Proxy's branch will still exist because we still have references that watch the old branch instance. If the branch gets reassigned a new value, a new ProxyInternalProps branch will get created but the old one will still exist as ghost branches.*/
/*Ghost branches (duplicated branches) can be removed by unregistering the watchers that referenced them*/
export const ProxyObject = async <T>(obj: T, mainScope: IMainScope) => {
  const options = {
    mainScope,
    watchedProxiesMap: new WeakMap(),
    registeringNestedOnChangeCallback: false,
    unRegisteringOnChangeCallback: false,
    reRegisteringOnChangeCallback: false,
    callbackToRegister: undefined as CallableFunction | undefined,
    propsCallbackToRegister: undefined as CallableFunction[] | undefined,
    registerOnChangeCallback(
      propsCallbacks: CallableFunction[],
      callback: CallableFunction
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
      callback: CallableFunction
    ) {
      options.unRegisteringOnChangeCallback = true;
      this.registerOnChangeCallback(propsCallbacks, callback);
      options.unRegisteringOnChangeCallback = false;
    }
  };
  return {
    /*need to make this entire object a proxy and protect mainModule from deletion as well as make sure new entries */
    state: new Proxy(obj as never, handler(options, undefined, 'root')) as T,
    registerOnChangeCallback: options.registerOnChangeCallback.bind(options),
    unRegisterOnChangeCallback:
      options.unRegisterOnChangeCallback.bind(options),
    options
  };
};
