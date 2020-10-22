import * as Cx from "../core";
import { IsolatedScope, IsolatedScopeProps } from "./IsolatedScope";

export interface DetachedScopeProps extends IsolatedScopeProps {
   /**
    * A single binding path or a list of paths to be monitored for changes.
    * Use `exclusive` as a shorthand for defining the `exclusiveData` object.
    */
   exclusive?: string | string[];

   /** Exclusive data selector. If only exclusive data change, the scope will be re-rendered without recalculating other elements on the page.
    * Use in case if the scope uses both exclusive and shared data. */
   exclusiveData?: Cx.StructuredProp;

   /** Name of the scope used for debugging/reporting purposes. */
   name?: string;
}

export class DetachedScope<T extends DetachedScopeProps> extends IsolatedScope<T> {}
