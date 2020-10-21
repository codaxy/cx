import { AugmentedViewBase } from "../data/AugmentedViewBase";

export class NestedDataView extends AugmentedViewBase {
   embedAugmentData(result, parentStoreData) {
      if (this.nestedData) {
         let nested = this.nestedData.getSelector()(parentStoreData);
         for (let key in nested) result[key] = nested[key];
      }
   }

   isExtraKey(key) {
      return this.nestedData && this.nestedData.containsKey(key);
   }

   setExtraKeyValue(key, value) {
      this.nestedData.setItem(key, value);
   }

   deleteExtraKeyValue(key) {
      this.setExtraKeyValue(key, undefined);
   }
}
