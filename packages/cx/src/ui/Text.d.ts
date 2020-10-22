import * as Cx from "../core";
import { Widget, WidgetConfig } from "./Widget";

export interface TextConfig extends WidgetConfig {
   value?: Cx.StringProp;
   bind?: string;
   tpl?: string;
   expr?: string;
}

export class Text extends Widget<TextConfig> {}
