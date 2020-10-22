import { isFunction } from "../util/isFunction";
import { Component } from "../util/Component";
import { Binding } from "./Binding";

export class Ref extends Component {
   constructor(config) {
      super(config);
      this.get = this.get.bind(this);
      if (this.set) this.set = this.set.bind(this);
   }

   get() {
      throw new Error("Ref's get method is not implemented.");
   }

   init(value) {
      if (this.get() === undefined) this.set(value);
   }

   toggle() {
      this.set(!this.get());
   }

   update(cb, ...args) {
      this.set(cb(this.get(), ...args));
   }

   as(config) {
      return Ref.create(config, {
         get: this.get,
         set: this.set,
      });
   }

   ref(path) {
      let binding = Binding.get(path);
      return Ref.create({
         get: () => binding.value(this.get()),
         set: (value) => {
            let data = this.get();
            let newData = binding.set(data, value);
            if (data === newData) return false;
            return this.set(newData);
         },
      });
   }

   //allows the function to be passed as a selector, e.g. to computable or addTrigger
   memoize() {
      return this.get;
   }
}

Ref.prototype.isRef = true;

Ref.factory = function (alias, config, more) {
   if (isFunction(alias)) {
      let cfg = {
         ...config,
         ...more,
      };

      if (cfg.store) Object.assign(cfg, cfg.store.getMethods());

      let result = alias(cfg);
      if (result instanceof Ref) return result;

      return this.create({
         ...config,
         ...more,
         ...result,
      });
   }

   return this.create({
      ...config,
      ...more,
   });
};
