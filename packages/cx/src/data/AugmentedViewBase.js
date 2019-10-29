import {View} from './View';
import {Binding} from "./Binding";

export class AugmentedViewBase extends View {

   getData() {
      if (this.sealed && this.meta.version === this.cache.version)
         return this.cache.result;
      let data = this.store.getData();
      if (this.sealed || this.immutable || this.store.sealed)
         data = {...data};
      this.embedAugmentData(data, data);
      this.cache.result = data;
      this.cache.version = this.meta.version;
      return this.cache.result;
   }

   embedAugmentData(result, parentStoreData) {
      throw new Error("abstract");
   }

   setExtraKeyValue(key, value) {
      throw new Error("abstract");
   }

   deleteExtraKeyValue(key) {
      throw new Error("abstract");
   }

   isExtraKey(key) {
      throw new Error("abstract");
   }

   setItem(path, value) {
      let binding = Binding.get(path);
      if (this.isExtraKey(binding.parts[0])) {
         let bindingRoot = binding.parts[0];
         let newValue = value;
         if (binding.parts.length > 1) {
            let data = {};
            this.embedAugmentData(data, this.store.getData());
            newValue = binding.set(data, value)[bindingRoot];
         }
         return this.setExtraKeyValue(bindingRoot, newValue);
      }
      return super.setItem(path, value);
   }

   deleteItem(path) {
      let binding = Binding.get(path);
      if (this.isExtraKey(binding.parts[0])) {
         if (binding.parts.length == 1)
            return this.deleteExtraKeyValue(binding.parts[0]);
         return this.setItem(path, value);
      }
      return super.deleteItem(path, value);
   }
}

AugmentedViewBase.prototype.immutable = false;