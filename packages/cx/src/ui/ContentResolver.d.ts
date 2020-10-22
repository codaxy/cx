import * as Cx from "../core";
import { PureContainer, PureContainerProps } from "./PureContainer";

interface ContentResolverProps extends PureContainerProps {
   params?: Cx.StructuredProp;
   mode?: "replace" | "prepend" | "append";

   onResolve?: (params, Instance) => any;

   loading?: Cx.BooleanProp;
}

export class ContentResolver<T extends ContentResolverProps> extends PureContainer<T> {}
