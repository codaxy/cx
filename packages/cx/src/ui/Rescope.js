import { Widget } from "./Widget";
import { PureContainer } from "./PureContainer";
import { Binding } from "../data/Binding";
import { ZoomIntoPropertyView } from "../data/ZoomIntoPropertyView";
import { StructuredInstanceDataAccessor } from "./StructuredInstanceDataAccessor";
import { isObject } from "../util/isObject";

export class Rescope extends PureContainer {
   init() {
      this.binding = Binding.get(this.bind);
      if (this.rootAlias) this.rootName = this.rootAlias;
      super.init();
   }

   initInstance(context, instance) {
      instance.store = new ZoomIntoPropertyView({
         store: instance.store,
         binding: this.binding,
         rootName: this.rootName,
         nestedData: isObject(this.data) ? new StructuredInstanceDataAccessor({ instance, data: this.data }) : null,
      });
      instance.setStore = (store) => {
         instance.store.setStore(store);
      };
   }
}

Rescope.prototype.bind = "$page";
Rescope.prototype.rootName = "$root";

Widget.alias("rescope", Rescope);
