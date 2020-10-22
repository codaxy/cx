import { Binding } from "./Binding";
import { isArray } from "../util/isArray";
import { isDefined } from "../util/isDefined";
import { StoreRef } from "./StoreRef";

export class View {
   constructor(config) {
      Object.assign(this, config);
      this.cache = {
         version: -1,
      };
      if (this.store) this.setStore(this.store);
   }

   getData() {
      throw new Error("abstract method");
   }

   init(path, value) {
      if (path instanceof Binding) path = path.path;
      else if (typeof path == "object" && path != null) {
         var changed = false;
         for (var key in path)
            if (path.hasOwnProperty(key) && this.get(key) === undefined && this.setItem(key, path[key])) changed = true;
         return changed;
      }

      if (this.get(path) === undefined) return this.setItem(path, value);

      return false;
   }

   set(path, value) {
      if (path instanceof Binding) path = path.path;
      else if (typeof path == "object" && path != null) {
         var changed = false;
         for (var key in path) if (path.hasOwnProperty(key) && this.setItem(key, path[key])) changed = true;
         return changed;
      }
      return this.setItem(path, value);
   }

   copy(from, to) {
      let value = this.get(from);
      this.set(to, value);
   }

   move(from, to) {
      this.batch(() => {
         this.copy(from, to);
         this.delete(from);
      });
   }

   //protected
   setItem(path, value) {
      if (this.store) return this.store.setItem(path, value);

      throw new Error("abstract method");
   }

   delete(path) {
      if (path instanceof Binding) path = path.path;
      else if (arguments.length > 1) path = Array.from(arguments);

      if (isArray(path)) return path.map((arg) => this.deleteItem(arg)).some(Boolean);

      return this.deleteItem(path);
   }

   //protected
   deleteItem(path) {
      if (this.store) return this.store.deleteItem(path);

      throw new Error("abstract method");
   }

   clear() {
      if (this.store) return this.store.clear();

      throw new Error("abstract method");
   }

   get(path) {
      let storeData = this.getData();

      if (arguments.length > 1) path = Array.from(arguments);

      if (isArray(path)) return path.map((arg) => Binding.get(arg).value(storeData));

      return Binding.get(path).value(storeData);
   }

   toggle(path) {
      return this.set(path, !this.get(path));
   }

   update(path, updateFn, ...args) {
      return this.set(path, updateFn.apply(null, [this.get(path), ...args]));
   }

   batch(callback) {
      let dirty = this.silently(callback);
      if (dirty) this.notify();
      return dirty;
   }

   silently(callback) {
      if (this.store) return this.store.silently(callback);

      throw new Error("abstract method");
   }

   notify(path) {
      if (this.notificationsSuspended) this.dirty = true;
      else this.doNotify(path);
   }

   doNotify(path) {
      if (this.store) return this.store.notify(path);

      throw new Error("abstract method");
   }

   subscribe(callback) {
      if (this.store) return this.store.subscribe(callback);

      throw new Error("abstract method");
   }

   load(data) {
      return this.batch((store) => {
         for (var key in data) store.set(key, data[key]);
      });
   }

   dispatch(action) {
      if (this.store) return this.store.dispatch(action);

      throw new Error("The underlying store doesn't support dispatch.");
   }

   getMeta() {
      return this.meta;
   }

   setStore(store) {
      this.store = store;
      this.meta = store.getMeta();
   }

   ref(path, defaultValue) {
      if (isDefined(defaultValue)) this.init(path, defaultValue);
      return StoreRef.create({
         store: this,
         path,
      });
   }

   getMethods() {
      return {
         getData: this.getData.bind(this),
         set: this.set.bind(this),
         get: this.get.bind(this),
         update: this.update.bind(this),
         delete: this.delete.bind(this),
         toggle: this.toggle.bind(this),
         init: this.init.bind(this),
         ref: this.ref.bind(this),
      };
   }
}

View.prototype.sealed = false; //indicate that data should be copied before virtual items are added
