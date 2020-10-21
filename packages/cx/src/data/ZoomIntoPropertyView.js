import { View } from "./View";
import { Binding } from "./Binding";
import { AugmentedViewBase } from "./AugmentedViewBase";
import { NestedDataView } from "./NestedDataView";

export class ZoomIntoPropertyView extends NestedDataView {
   getBaseData(parentStoreData) {
      let x = this.binding.value(parentStoreData);
      if (x != null && typeof x != "object") throw new Error("Zoomed value must be an object.");
      return {
         ...x,
      };
   }

   embedAugmentData(result, parentStoreData) {
      result[this.rootName] = parentStoreData;
      super.embedAugmentData(result, parentStoreData);
   }

   setItem(path, value) {
      if (path.indexOf(this.rootName + ".") == 0) this.store.setItem(path.substring(this.rootName.length + 1), value);
      else super.setItem(this.binding.path + "." + path, value);
   }

   deleteItem(path) {
      if (path.indexOf(this.rootName + ".") == 0) this.store.deleteItem(path.substring(this.rootName.length + 1));
      else super.deleteItem(this.binding.path + "." + path);
   }
}

ZoomIntoPropertyView.prototype.rootName = "$root";
