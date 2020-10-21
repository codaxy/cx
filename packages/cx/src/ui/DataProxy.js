import { NestedDataView } from "../data/NestedDataView";
import { UseParentLayout } from "../ui/layout/UseParentLayout";
import { PureContainer } from "./PureContainer";
import { StructuredInstanceDataAccessor } from "./StructuredInstanceDataAccessor";

export class DataProxy extends PureContainer {
   init() {
      if (!this.data) this.data = {};

      if (this.alias) this.data[this.alias] = this.value;

      //not sure why nesting is needed, commenting for now
      // this.container = PureContainer.create({
      //    type: PureContainer,
      //    items: this.children || this.items,
      //    layout: this.layout,
      //    controller: this.controller,
      //    outerLayout: this.outerLayout,
      //    ws: this.ws,
      // });
      // this.children = [this.container];
      // delete this.items;
      // delete this.controller;
      // delete this.outerLayout;
      // this.layout = UseParentLayout;
      super.init();
   }

   initInstance(context, instance) {
      instance.store = new NestedDataView({
         store: instance.store,
         nestedData: new StructuredInstanceDataAccessor({ instance, data: this.data }),
         immutable: this.immutable,
         sealed: this.sealed,
      });

      instance.setStore = (store) => {
         instance.store.setStore(store);
      };
   }
}

DataProxy.prototype.immutable = false;
DataProxy.prototype.sealed = false;
