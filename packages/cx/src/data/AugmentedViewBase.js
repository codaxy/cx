import { View } from "./View";
import { Binding } from "./Binding";

export class AugmentedViewBase extends View {
   getData() {
      if (this.meta.version === this.cache.version && this.sealed)
         return this.cache.result;
      let parentStoreData = this.store.getData();
      let result = this.getBaseData(parentStoreData);
      this.embedAugmentData(result, parentStoreData);
      this.cache.result = result;
      this.cache.parentStoreData = parentStoreData;
      this.cache.version = this.meta.version;
      return this.cache.result;
   }

   getBaseData(parentStoreData) {
      if (this.sealed || this.immutable || this.store.sealed) return { ...parentStoreData };
      return parentStoreData;
   }

   embedAugmentData(result, parentStoreData) {
      throw new Error("abstract");
   }

   isExtraKey(key) {
      throw new Error("abstract");
   }

   setExtraKeyValue(key, value) {
      throw new Error("abstract");
   }

   deleteExtraKeyValue(key) {
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
         let bindingRoot = binding.parts[0];
         if (binding.parts.length == 1) return this.deleteExtraKeyValue(bindingRoot);
         let data = {};
         this.embedAugmentData(data, this.store.getData());
         let newValue = binding.delete(data)[bindingRoot];
         return this.setExtraKeyValue(bindingRoot, newValue);
      }
      return super.deleteItem(path);
   }
}

AugmentedViewBase.prototype.immutable = false;
