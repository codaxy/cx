import { Controller } from "./Controller";
import { debug, renderFlag, processDataFlag, destroyFlag } from "../util/Debug";
import { GlobalCacheIdentifier } from "../util/GlobalCacheIdentifier";
import { throttle } from "../util/throttle";
import { validatedDebounce } from "../util/validatedDebounce";
import { batchUpdates } from "./batchUpdates";
import { isString } from "../util/isString";
import { isFunction } from "../util/isFunction";
import { isDefined } from "../util/isDefined";
import { isArray } from "../util/isArray";
import { isObject } from "../util/isObject";
import { isNonEmptyArray } from "../util/isNonEmptyArray";
import { isUndefined } from "../util/isUndefined";

let instanceId = 1000;

export class Instance {
   constructor(widget, key, parent, store) {
      this.widget = widget;
      this.key = key;
      this.id = String(++instanceId);
      this.cached = {};
      this.parent = parent;
      this.store = store;
   }

   setStore(store) {
      this.store = store;
   }

   init(context) {
      //widget is initialized when first instance is initialized
      if (!this.widget.initialized) {
         this.widget.init(context);
         this.widget.initialized = true;
      }

      if (!this.dataSelector) {
         this.widget.selector.init(this.store);
         this.dataSelector = this.widget.selector.createStoreSelector();
      }

      //init instance might change the store, so it must go before the controller
      this.widget.initInstance(context, this);
      this.widget.initState(context, this);

      if (this.widget.controller)
         this.controller = Controller.create(this.widget.controller, {
            widget: this.widget,
            instance: this,
            store: this.store,
         });

      if (
         this.widget.exploreCleanup ||
         this.widget.outerLayout ||
         this.widget.isContent ||
         this.widget.controller ||
         this.widget.prepareCleanup
      )
         this.needsExploreCleanup = true;
      if (this.widget.prepare || this.widget.controller) this.needsPrepare = true;
      if (this.widget.cleanup || this.widget.controller) this.needsCleanup = true;
      this.initialized = true;
   }

   checkVisible(context) {
      if (!this.initialized) this.init(context);

      let wasVisible = this.visible;
      this.rawData = this.dataSelector(this.store);
      this.visible = this.widget.checkVisible(context, this, this.rawData);
      if (this.visible && !this.detached) this.parent.instanceCache.addChild(this);
      this.explored = false;
      this.prepared = false;

      if (!this.visible && wasVisible) this.destroy();

      return this.visible;
   }

   scheduleExploreIfVisible(context) {
      if (this.checkVisible(context)) {
         context.exploreStack.push(this);

         if (this.needsExploreCleanup) context.exploreStack.push(this);

         return true;
      }
      return false;
   }

   cache(key, value) {
      let oldValue = this.cached[key];
      if (oldValue === value) return false;

      if (!this.cacheList) this.cacheList = {};
      this.cacheList[key] = value;
      return true;
   }

   markShouldUpdate(context) {
      let ins = this;
      let renderList = this.renderList;
      renderList.markReverseIndex();

      //notify all parents that child state changed to bust up caching
      while (ins && !ins.shouldUpdate && ins.explored) {
         if (ins.renderList !== renderList) {
            renderList.reverse();
            renderList = ins.renderList;
            renderList.markReverseIndex();
         }
         ins.shouldUpdate = true;
         renderList.data.push(ins);
         ins = ins.widget.isContent
            ? ins.contentPlaceholder
            : ins.parent.outerLayout === ins
               ? ins.parent.parent
               : ins.parent;
      }
      renderList.reverse();
   }

   explore(context) {
      if (!this.visible) throw new Error("Explore invisible!");

      if (this.explored) {
         if (this.widget.prepareCleanup) context.prepareList.push(this);

         if (this.widget.exploreCleanup) this.widget.exploreCleanup(context, this);

         if (this.parent.outerLayout === this) context.popNamedValue("content", "body");

         if (this.widget.controller) context.pop("controller");

         return;
      }

      this.explored = true;

      if (this.needsPrepare) context.prepareList.push(this);
      else this.prepared = true;

      if (this.needsCleanup) context.cleanupList.push(this);

      if (this.instanceCache) this.instanceCache.mark();

      //controller may reconfigure the widget and need to go before shouldUpdate calculation
      this.parentOptions = context.parentOptions;

      if (!this.controller) {
         if (context.controller) this.controller = context.controller;
         else if (this.parent.controller) this.controller = this.parent.controller;
      }

      this.destroyTracked = false;

      if (this.controller) {
         if (this.widget.controller) {
            if (!this.controller.initialized) {
               this.controller.init(context);
               this.controller.initialized = true;
            }
            context.push("controller", this.controller);
            this.controller.explore(context);
            if (this.controller.onDestroy && this.controller.widget == this.widget) this.trackDestroy();
         }
      }

      if (this.widget.onDestroy || isNonEmptyArray(this.destroySubscriptions)) this.trackDestroy();

      this.renderList = this.assignedRenderList || this.parent.renderList || context.getRootRenderList();

      let shouldUpdate =
         this.rawData !== this.cached.rawData ||
         this.state !== this.cached.state ||
         this.widget.version !== this.cached.widgetVersion ||
         this.cached.globalCacheIdentifier !== GlobalCacheIdentifier.get();

      if (shouldUpdate) {
         this.data = { ...this.rawData };
         this.widget.prepareData(context, this);
         debug(processDataFlag, this.widget);
      }

      //onExplore might set the outer layout
      if (this.widget.onExplore) this.widget.onExplore(context, this);

      if (this.parent.outerLayout === this) {
         this.renderList = this.renderList.insertRight();
         context.pushNamedValue("content", "body", this.parent);
      }

      if (this.widget.outerLayout) {
         this.outerLayout = this.getChild(context, this.widget.outerLayout, null, this.store);
         this.outerLayout.scheduleExploreIfVisible(context);
         this.renderList = this.renderList.insertLeft();
      }

      if (this.widget.isContent) {
         this.contentPlaceholder = context.contentPlaceholder && context.contentPlaceholder[this.widget.putInto];
         if (this.contentPlaceholder) context.contentPlaceholder[this.widget.putInto](this);
         else {
            this.renderList = this.renderList.insertLeft();
            context.pushNamedValue("content", this.widget.putInto, this);
         }
      }

      this.shouldUpdate = false;
      if (shouldUpdate || this.childStateDirty || !this.widget.memoize) this.markShouldUpdate(context);

      context.exploreStack.hop();

      if (this.widget.helpers) {
         this.helpers = {};
         for (let cmp in this.widget.helpers) {
            let helper = this.widget.helpers[cmp];
            if (helper) {
               let ins = this.getChild(context, helper);
               if (ins.scheduleExploreIfVisible(context)) this.helpers[cmp] = ins;
            }
         }
      }

      this.widget.explore(context, this, this.data);
   }

   prepare(context) {
      if (!this.visible) throw new Error("Prepare invisible!");

      if (this.prepared) {
         if (this.widget.prepareCleanup) this.widget.prepareCleanup(context, this);
         return;
      }

      this.prepared = true;
      if (this.widget.prepare) this.widget.prepare(context, this);

      if (this.widget.controller && this.controller.prepare) this.controller.prepare(context);
   }

   render(context) {
      if (!this.visible) throw new Error("Render invisible!");

      if (this.shouldUpdate) {
         debug(renderFlag, this.widget, this.key);
         let vdom = renderResultFix(this.widget.render(context, this, this.key));
         if (this.widget.isContent || this.outerLayout) this.contentVDOM = vdom;
         else this.vdom = vdom;
      }

      if (this.cacheList) for (let key in this.cacheList) this.cached[key] = this.cacheList[key];

      this.cacheList = null;

      this.cached.rawData = this.rawData;
      this.cached.data = this.data;
      this.cached.state = this.state;
      this.cached.widgetVersion = this.widget.version;
      this.cached.globalCacheIdentifier = GlobalCacheIdentifier.get();
      this.childStateDirty = false;

      if (this.instanceCache) this.instanceCache.sweep();

      if (this.parent.outerLayout === this) {
         //if outer layouts are chained we need to find the originating element (last element with OL set)
         let parent = this.parent;
         while (parent.parent.outerLayout == parent) parent = parent.parent;
         parent.vdom = this.vdom;
      }

      return this.vdom;
   }

   cleanup(context) {
      if (this.widget.controller && this.controller.cleanup) this.controller.cleanup(context);

      if (this.widget.cleanup) this.widget.cleanup(context, this);
   }

   trackDestroy() {
      if (!this.destroyTracked) {
         this.destroyTracked = true;
         if (this.parent && !this.detached) this.parent.trackDestroyableChild(this);
      }
   }

   trackDestroyableChild(child) {
      this.instanceCache.trackDestroy(child);
      this.trackDestroy();
   }

   subscribeOnDestroy(callback) {
      if (!this.destroySubscriptions) this.destroySubscriptions = [];
      this.destroySubscriptions.push(callback);
      this.trackDestroy();
      return () => {
         this.destroySubscriptions && this.destroySubscriptions.filter((cb) => cb != callback);
      };
   }

   destroy() {
      if (this.instanceCache) {
         this.instanceCache.destroy();
         this.instanceCache = null;
      }

      if (this.destroySubscriptions) {
         this.destroySubscriptions.forEach((cb) => cb());
         this.destroySubscriptions = null;
      }

      if (this.destroyTracked) {
         debug(destroyFlag, this);

         if (this.widget.onDestroy) this.widget.onDestroy(this);

         if (
            this.widget.controller &&
            this.controller &&
            this.controller.onDestroy &&
            this.controller.widget == this.widget
         )
            this.controller.onDestroy();

         this.destroyTracked = false;
      }
   }

   setState(state) {
      let skip = !!this.state;
      if (this.state)
         for (let k in state) {
            if (this.state[k] !== state[k]) {
               skip = false;
               break;
            }
         }

      if (skip) return;

      this.state = Object.assign({}, this.state, state);
      let parent = this.parent;
      //notify all parents that child state change to bust up caching
      while (parent) {
         parent.childStateDirty = true;
         parent = parent.parent;
      }
      batchUpdates(() => {
         this.store.notify();
      });
   }

   set(prop, value, options = {}) {
      //skip re-rendering (used for reading state from uncontrolled components)
      if (options.internal && this.rawData) {
         this.rawData[prop] = value;
         this.data[prop] = value;
      }

      let setter = this.setters && this.setters[prop];
      if (setter) {
         if (options.immediate && isFunction(setter.reset)) setter.reset(value);
         else setter(value);
         return true;
      }

      let p = this.widget[prop];
      if (p && typeof p == "object") {
         if (p.debounce) {
            this.definePropertySetter(
               prop,
               validatedDebounce(
                  (value) => this.doSet(prop, value),
                  () => this.dataSelector(this.store)[prop],
                  p.debounce
               )
            );
            this.set(prop, value, options);
            return true;
         }

         if (p.throttle) {
            this.definePropertySetter(
               prop,
               throttle((value) => this.doSet(prop, value), p.throttle)
            );
            this.set(prop, value, options);
            return true;
         }
      }

      return this.doSet(prop, value);
   }

   definePropertySetter(prop, setter) {
      if (!this.setters) this.setters = {};
      this.setters[prop] = setter;
   }

   doSet(prop, value) {
      let changed = false;
      batchUpdates(() => {
         let p = this.widget[prop];
         if (isObject(p)) {
            if (p.set) {
               if (isFunction(p.set)) {
                  p.set(value, this);
                  changed = true;
               } else if (isString(p.set)) {
                  this.controller[p.set](value, this);
                  changed = true;
               }
            } else if (p.action) {
               let action = p.action(value, this);
               this.store.dispatch(action);
               changed = true;
            } else if (isString(p.bind)) {
               changed = this.store.set(p.bind, value);
            }
         }
      });
      return changed;
   }

   nestedDataSet(key, value, dataConfig) {
      let config = dataConfig[key];
      if (!config)
         throw new Error(`Unknown nested data key ${key}. Known keys are ${Object.keys(dataConfig).join(", ")}.`);

      if (config.bind)
         return isUndefined(value) ? this.store.deleteItem(config.bind) : this.store.setItem(config.bind, value);

      if (!config.set)
         throw new Error(
            `Cannot change nested data value for ${key} as it's read-only. Either define it as a binding or define a set function.`
         );
      if (isString(config.set)) this.getControllerMethod(config.set)(value, this);
      else if (isFunction(config.set)) config.set(value, this);
      else
         throw new Error(
            `Cannot change nested data value for ${key} the defined setter is neither a function nor a controller method.`
         );

      return true;
   }

   replaceState(state) {
      this.cached.state = this.state;
      this.state = state;
      this.store.notify();
   }

   getInstanceCache() {
      if (!this.instanceCache)
         this.instanceCache = new InstanceCache(this, this.widget.isPureContainer ? this.key : null);
      return this.instanceCache;
   }

   clearChildrenCache() {
      if (this.instanceCache) this.instanceCache.destroy();
   }

   getChild(context, widget, key, store) {
      return this.getInstanceCache().getChild(widget, store || this.store, key);
   }

   getDetachedChild(widget, key, store) {
      let child = new Instance(widget, key, this, store || this.store);
      child.detached = true;
      return child;
   }

   prepareRenderCleanupChild(widget, store, keyPrefix, options) {
      return widget.prepareRenderCleanup(store || this.store, options, keyPrefix, this);
   }

   getJsxEventProps() {
      let { widget } = this;

      if (!isArray(widget.jsxAttributes)) return null;

      let props = {};
      widget.jsxAttributes.forEach((attr) => {
         if (attr.indexOf("on") == 0 && attr.length > 2) props[attr] = (e) => this.invoke(attr, e, this);
      });
      return props;
   }

   getCallback(methodName) {
      let scope = this.widget;
      let callback = scope[methodName];

      if (typeof callback === "string") return this.getControllerMethod(callback);

      if (typeof callback !== "function")
         throw new Error(`Cannot invoke callback method ${methodName} as assigned value is not a function.`);

      return callback.bind(scope);
   }

   getControllerMethod(methodName) {
      if (!this.controller)
         throw new Error(
            `Cannot invoke controller method "${methodName}" as controller is not assigned to the widget.`
         );

      let at = this;
      while (at != null && at.controller && !at.controller[methodName]) at = at.parent;

      if (!at || !at.controller || !at.controller[methodName])
         throw new Error(
            `Cannot invoke controller method "${methodName}". The method cannot be found in any of the assigned controllers.`
         );

      return at.controller[methodName].bind(at.controller);
   }

   invoke(methodName, ...args) {
      return this.getCallback(methodName).apply(null, args);
   }

   invokeControllerMethod(methodName, ...args) {
      return this.getControllerMethod(methodName).apply(null, args);
   }
}

function renderResultFix(res) {
   return res != null && isDefined(res.content) ? res : { content: res };
}

export class InstanceCache {
   constructor(parent, keyPrefix) {
      this.children = {};
      this.parent = parent;
      this.marked = {};
      this.monitored = null;
      this.keyPrefix = keyPrefix != null ? keyPrefix + "-" : "";
   }

   getChild(widget, store, key) {
      let k = this.keyPrefix + (key != null ? key : widget.widgetId);
      let instance = this.children[k];

      if (!instance || (!instance.visible && (instance.widget.controller || instance.widget.onInit))) {
         instance = new Instance(widget, k, this.parent);
         this.children[k] = instance;
      }
      if (instance.store !== store) instance.setStore(store);

      return instance;
   }

   addChild(instance) {
      this.marked[instance.key] = instance;
   }

   mark() {
      this.marked = {};
   }

   trackDestroy(instance) {
      if (!this.monitored) this.monitored = {};
      this.monitored[instance.key] = instance;
   }

   destroy() {
      this.children = {};
      this.marked = {};

      if (!this.monitored) return;

      for (let key in this.monitored) {
         this.monitored[key].destroy();
      }

      this.monitored = null;
   }

   sweep() {
      this.children = this.marked;
      if (!this.monitored) return;
      let activeCount = 0;
      for (let key in this.monitored) {
         let monitoredChild = this.monitored[key];
         let child = this.children[key];
         if (child !== monitoredChild || !monitoredChild.visible) {
            monitoredChild.destroy();
            delete this.monitored[key];
            if (child === monitoredChild) delete this.children[key];
         } else activeCount++;
      }
      if (activeCount === 0) this.monitored = null;
   }
}
