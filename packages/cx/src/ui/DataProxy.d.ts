import * as Cx from "../core";

import { PureContainerProps, PureContainer } from "./PureContainer";

interface DataProxyProps extends PureContainerProps {
   data?: Cx.StructuredProp;
   value?: Cx.Binding;
   alias?: string;
   cached?: boolean;
}

export class DataProxy<T extends DataProxyProps> extends PureContainer<T> {}
