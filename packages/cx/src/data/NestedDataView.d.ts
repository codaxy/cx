import { AugmentedViewBase, AugmentedViewBaseConfig } from "./AugmentedViewBase";
import { StructuredDataAccessor } from "./StructuredDataAccessor";

export interface NestedDataViewConfig extends AugmentedViewBaseConfig {
   nestedData?: StructuredDataAccessor;
}

export class NestedDataView extends AugmentedViewBase {
   constructor(config: NestedDataViewConfig);
   nestedData: StructuredDataAccessor;
}
