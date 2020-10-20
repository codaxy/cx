export = Cx;
export as namespace Cx;

import * as React from "./react.d";

declare namespace Cx {
   type Bind = {
      bind: string;
      defaultValue?: any;
      throttle?: number;
      debounce?: number;
   };

   type Tpl = {
      tpl: string;
      defaultValue?: any;
   };

   type Expr = {
      expr: string;
      defaultValue?: any;
   };

   type Binding = Bind | Tpl | Expr;

   type Selector<T> = (data: any) => T;

   interface StructuredSelector {
      [prop: string]: Selector<any>;
   }

   type Prop<T> = Binding | T | Selector<T>;

   interface Record {
      [prop: string]: any;
   }

   interface Config {
      [prop: string]: any;
   }

   interface StructuredProp {
      [prop: string]: Prop<any>;
   }

   type StringProp = Prop<string>;
   type StyleProp = Prop<string | React.CSSProperties> | StructuredProp;
   type NumberProp = Prop<number>;
   type BooleanProp = Prop<boolean>;
   type ClassProp = Prop<string> | StructuredProp;
   type RecordsProp = Prop<Record[]>;
   type SortersProp = Prop<Sorter[]>;

   interface WidgetProps {
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
      visible?: BooleanProp;

      /** Visibility of the widget. Defaults to `true`. */
      if?: BooleanProp;

      /** Appearance modifier. For example, mod="big" will add the CSS class `.cxm-big` to the block element. */
      mod?: StringProp | Prop<string[]> | StructuredProp;

      /** Cache render output. Default is `true`. */
      memoize?: BooleanProp;

      /** Widget supports class, className and style attributes. */
      styled?: boolean;
   }

   interface PureContainerProps extends WidgetProps {
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

   interface StyledContainerProps extends PureContainerProps {
      /**
       * Additional CSS classes to be applied to the element.
       * If an object is provided, all keys with a "truthy" value will be added to the CSS class list.
       */
      class?: ClassProp;

      /**
       * Additional CSS classes to be applied to the element.
       * If an object is provided, all keys with a "truthy" value will be added to the CSS class list.
       */
      className?: ClassProp;

      /** Style object applied to the element */
      style?: StyleProp;

      /** Style object applied to the element */
      styles?: Cx.StyleProp;
   }

   interface HtmlElementProps extends StyledContainerProps {
      /** Id of the element */
      id?: string | number | Binding | Selector<string | number>;

      /** Inner text contents. */
      text?: string | number | Binding | Selector<string | number>;

      /** Tooltip configuration. */
      tooltip?: StringProp | StructuredProp;
   }

   interface Sorter {
      field?: string;
      value?: (Record) => any;
      direction: "ASC" | "DESC";
   }

   interface CollatorOptions {
      localeMatcher?: "lookup" | "best fit";
      usage?: "sort" | "search";
      sensitivity?: "base" | "accent" | "case" | "variant";
      ignorePunctuation?: boolean;
      numeric?: boolean;
      caseFirst?: "upper" | "lower" | "false";
   }

   export class Widget<P extends WidgetProps> {
      static create(typeAlias?: any, config?: Cx.Config, more?: Cx.Config): any;

      constructor(props: P);

      props?: P;

      render(context: any, instance: any, key: string);
   }

   type CxWidget = Widget<any>;

   type CxChild = WidgetProps | CxWidget | string | number;

   type CxChildren = CxChild | CxChild[] | boolean | null | undefined;

   type CxRootNode = { children?: CxChildren };
}

declare global {
   namespace JSX {
      type Element = Cx.CxChild;

      type ElementClass = Cx.CxWidget;

      interface IntrinsicElements {
         cx: Cx.CxRootNode;
         div: any;
         main: any;
      }

      interface ElementChildrenAttribute {
         children: {}; // specify children name to use
      }
   }
}

// declare module "react" {
//    interface ClassAttributes<T> extends Cx.PureContainerProps {
//       class?: Cx.ClassProp;
//       styles?: Cx.StyleProp;
//       text?: Cx.StringProp;
//       innerText?: Cx.StringProp;
//       html?: Cx.StringProp;
//       innerHtml?: Cx.StringProp;
//    }

//    //this doesn't work, however, it would be nice if it does
//    // interface EventHandler<E extends React.SyntheticEvent<any>> {
//    //    (event: E, instance?: any): void;
//    // }
// }
