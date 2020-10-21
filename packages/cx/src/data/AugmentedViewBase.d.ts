import { View, ViewConfig } from "./View";
import * as Cx from "../core";

export interface AugmentedViewConfig extends ViewConfig {
   immutable?: boolean;
}

export abstract class AugmentedViewBase extends View {
   constructor(config: AugmentedViewConfig);

   protected abstract setExtraKeyValue(key: string, value: any): boolean;

   protected abstract deleteExtraKeyValue(key: string): boolean;

   protected abstract isExtraKey(key: string): boolean;

   protected abstract embedAugmentData(result: Cx.Record, parentStoreData: Cx.Record): void;
}
