import * as Cx from "../core";
import { RenderingContext } from "./RenderingContext";
import { View } from "../data/View";
import { Widget, VDOM } from "./Widget";

export class Instance {
   store: View;
   data: Cx.Record;
   widget: Widget;
   key: number;
   id: string;
   controller: any;
   parentOptions: any;

   constructor(widget: Widget, key: string | number, parent?: Instance, store?: View);

   setStore(store: View): void;

   init(context: RenderingContext): void;

   explore(context: RenderingContext): boolean;

   prepare(context: RenderingContext): void;

   cleanup(context: RenderingContext): void;

   render(context: RenderingContext, keyPrefix?: string): JSX.Element | void;

   setState(state: Cx.Record): void;

   set(prop: string, value: any, internal?: boolean);

   definePropertySetter(prop: string, setter: (value: any) => void): boolean;

   /**
    * @protected
    * @param prop
    * @param value
    * @returns {boolean}
    */
   protected doSet(prop: string, value: any): boolean;

   replaceState(state: Cx.Config);

   getInstanceCache(): InstanceCache;

   clearChildrenCache();

   getChild(context: RenderingContext | null, widget: Widget, keyPrefix?: string, store?: View): Instance;

   getDetachedChild(widget: Widget, key: number | string, store?: View): Instance;

   // TODO: check return type
   prepareRenderCleanupChild(widget: Widget, store?: View, keyPrefix?: string, options?: object): JSX.Element | void;

   getJsxEventProps(): Cx.Config;

   nestedDataSet(key: string, value: any, dataConfig: Cx.Config): boolean;
}

export class InstanceCache {
   constructor(parent: Instance);

   getChild(widget: Widget, store: View, keyPrefix?: string): Instance;

   mark();

   sweep();
}
