import { AugmentedViewBase, AugmentedViewBaseConfig } from "./AugmentedViewBase";
import { StructuredDataAccessor } from "./StructuredDataAccessor";

export interface NestedDataViewConfig extends AugmentedViewBaseConfig {
   nestedData?: StructuredDataAccessor;
}

export class NestedDataView extends AugmentedViewBase {
   constructor(config: NestedDataViewConfig);
   nestedData: StructuredDataAccessor;

   protected setExtraKeyValue(key: string, value: any): boolean;

   protected deleteExtraKeyValue(key: string): boolean;

   protected isExtraKey(key: string): boolean;

   protected embedAugmentData(result: Cx.Record, parentStoreData: Cx.Record): void;
}
