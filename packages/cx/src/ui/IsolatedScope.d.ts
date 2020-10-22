import * as Cx from "../core";

import { PureContainer, PureContainerProps } from "./PureContainer";

export interface IsolatedScopeProps extends PureContainerProps {
   /**
    * A single binding path or a list of paths to be monitored for changes.
    * Use `bind` as a shorthand for defining the `data` object.
    */
   bind?: string | string[];

   /** Data object selector. The children will update only if `data` change. */
   data?: Cx.StructuredProp;
}

export class IsolatedScope<T extends IsolatedScopeProps> extends PureContainer<T> {}
