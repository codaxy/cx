import * as Cx from "../core";
import { Component } from "../util/Component";
import { Widget, WidgetConfig } from "./Widget";

type Filter = string | Component;

export interface ContainerConfig extends WidgetConfig {
   /** Keep whitespace in text based children. Default is `false`. See also `trimWhitespace`. */
   ws?: boolean;

   /** Remove all whitespace in text based children. Default is `true`. See also `preserveWhitespace`. */
   trimWhitespace?: boolean;

   /** Keep whitespace in text based children. Default is `false`. See also `trimWhitespace`. */
   preserveWhitespace?: boolean;

   /** List of child elements. */
   items?: Cx.CxChildren;

   /** List of child elements. */
   children?: Cx.CxChildren;

   plainText?: boolean;
}

export class Container<T extends ContainerConfig> extends Widget<T> {
   add(...args: Array<any>);

   clear();

   addText(text: string);

   find(filter: Filter, options?: Cx.Config): any[];

   findFirst(filter: Filter, options?: Cx.Config): any;

   children?: Widget<any>[];
   items?: Widget<any>[];
}
