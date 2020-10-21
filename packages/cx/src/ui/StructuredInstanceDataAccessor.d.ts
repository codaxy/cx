import { StructuredDataAccessor } from "../data/StructuredDataAccessor";
import { Instance } from "./Instance";

export interface StructuredInstanceDataAccessorConfig {
   data: Cx.StructuredProp;
   instance: Instance;
}

export class StructuredInstanceDataAccessor extends StructuredDataAccessor {}
