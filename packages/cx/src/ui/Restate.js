import { PureContainer } from "./PureContainer";
import { Store } from "../data/Store";
import { Cx } from "./Cx";
import { isString } from "../util/isString";
import { VDOM } from "./VDOM";
import { isFunction } from "../util/isFunction";
import { isObject } from "../util/isObject";
import { isUndefined } from "../util/isUndefined";
import { Binding } from "../data/Binding";
import { StructuredSelector } from "../data/StructuredSelector";

let persistenceCache = {};

export class Restate extends PureContainer {
   declareData() {
      return super.declareData(...arguments, {
         deferredUntilIdle: undefined,
         idleTimeout: undefined,
         cacheKey: undefined,
      });
   }

   init() {
      this.container = PureContainer.create({
         type: PureContainer,
         items: this.children || this.items,
         layout: this.layout,
         controller: this.controller,
         outerLayout: this.outerLayout,
         useParentLayout: !this.detached,
         ws: this.ws,
      });
      this.privateDataSelector = new StructuredSelector({
         props: this.data || {},
         values: this.data,
      });
      delete this.items;
      delete this.children;
      delete this.controller;
      delete this.outerLayout;
      delete this.layout;
      if (this.useParentLayout == null) this.useParentLayout = !this.detached;
      super.init();
   }

   initSubStore(context, instance) {
      let { cacheKey } = instance.data;
      this.privateDataSelector.init(instance.store);
      instance.subStore = new RestateStore({
         store: instance.store,
         detached: this.detached,
         privateData: this.data || {},
         data: cacheKey ? persistenceCache[cacheKey] || {} : {},
         dataSelector: this.privateDataSelector.create(),
         onSet: (path, value) => instance.nestedDataSet(path, value, this.data),
      });

      instance.setStore = (store) => {
         instance.store = store;
         instance.subStore.setStore(store);
      };

      if (cacheKey) {
         instance.subscribeOnDestroy(() => {
            persistenceCache[cacheKey] = instance.subStore.getData();
         });
      }
   }

   explore(context, instance) {
      if (!instance.subStore) this.initSubStore(context, instance);
      if (instance.subStore.parentDataCheck()) instance.markShouldUpdate();
      super.explore(context, instance);
   }

   exploreItems(context, instance, items) {
      if (!this.detached) {
         instance.container = instance.getChild(context, this.container, "container", instance.subStore);
         instance.container.scheduleExploreIfVisible(context);
         instance.children = [instance.container];
      }
   }

   render(context, instance, key) {
      if (!this.detached) return instance.container.render(context);

      return (
         <Cx
            key={key}
            widget={this.container}
            parentInstance={instance}
            store={instance.subStore}
            subscribe
            options={this.options}
            onError={this.onError}
            deferredUntilIdle={instance.data.deferredUntilIdle}
            idleTimeout={instance.data.idleTimeout}
         />
      );
   }
}

Restate.prototype.detached = false;
Restate.prototype.waitForIdle = false;

export const PrivateStore = Restate;

class RestateStore extends Store {
   constructor(config) {
      super(config);
      this.parentDataVersion = -1;

      //initial data population should not cause an additional rendering pass
      this.silently(() => {
         this.parentDataCheck();
      });
   }

   parentDataCheck() {
      if (this.parentDataVersion == this.store.meta.version) return false;
      this.parentDataVersion = this.store.meta.version;
      this.parentData = this.dataSelector(this.store.getData());
      return this.batch(() => {
         for (let key in this.parentData) {
            super.setItem(key, this.parentData[key]);
         }
      });
   }

   setItem(path, value) {
      let binding = Binding.get(path);
      let bindingRoot = binding.parts[0];
      if (!isObject(this.privateData) || !this.privateData.hasOwnProperty(bindingRoot)) {
         let changed = isUndefined(value) ? super.deleteItem(path) : super.setItem(path, value);
         return changed;
      }
      let newValue = value;
      if (binding.parts.length > 1) newValue = binding.set(this.getData(), value)[bindingRoot];
      this.onSet(bindingRoot, newValue);
      this.batch(() => {
         super.setItem(bindingRoot, newValue);
         this.parentDataCheck();
      });
      return true;
   }

   deleteItem(path) {
      return this.setItem(path, undefined);
   }

   doNotify() {
      if (!this.detached) this.store.notify();
      super.doNotify();
   }
}
