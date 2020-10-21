import { getSelector } from "../data/getSelector";

export class StructuredInstanceDataAccessor {
   constructor(config) {
      this.instance = config.instance;
      this.dataConfig = config.data;
      this.dataSelector = getSelector(config.data);
      if (this.dataSelector.memoize) this.dataSelector = this.dataSelector.memoize();
   }
   getSelector() {
      return this.dataSelector;
   }
   get() {
      return this.dataSelector.get(this.instance.store.getData());
   }
   setItem(key, value) {
      this.instance.nestedDataSet(key, value, this.dataConfig);
   }
   containsKey(key) {
      return this.dataConfig.hasOwnProperty(key);
   }
   getKeys() {
      return Object.keys(this.dataConfig);
   }
}
