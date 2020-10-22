import { Component } from "../util/Component";

export interface WidgetConfig {
   /** Inner layout used to display children inside the widget. */
   layout?: any;

   /** Outer (wrapper) layout used to display the widget in. */
   outerLayout?: any;

   /** Name of the ContentPlaceholder that should be used to display the widget. */
   putInto?: string;

   /** Name of the ContentPlaceholder that should be used to display the widget. */
   contentFor?: string;

   /** Controller. */
   controller?: any;

   /** Visibility of the widget. Defaults to `true`. */
   visible?: Cx.BooleanProp;

   /** Visibility of the widget. Defaults to `true`. */
   if?: Cx.BooleanProp;

   /** Appearance modifier. For example, mod="big" will add the CSS class `.cxm-big` to the block element. */
   mod?: Cx.StringProp | Cx.Prop<string[]> | Cx.StructuredProp;

   /** Cache render output. Default is `true`. */
   memoize?: Cx.BooleanProp;

   /** Widget supports class, className and style attributes. */
   styled?: boolean;
}
export class Widget<P extends WidgetConfig> extends Component {
   static create(type: any, config?: any, more?: any): any;
   static resetCounter(): void;

   static create(typeAlias?: any, config?: Cx.Config, more?: Cx.Config): any;

   constructor(props: P);

   props?: P;

   render(context: any, instance: any, key: string);
}

export function contentAppend(result, w, prependSpace?): boolean;

export function getContentArray(x): any[];

export function getContent(x): null | any | any[];

export { VDOM } from "./VDOM";
