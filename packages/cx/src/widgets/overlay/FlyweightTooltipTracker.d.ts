import * as Cx from "../../core";
import { Instance } from "../../ui/Instance";

export interface FlyweightTooltipTrackerProps extends Cx.WidgetProps {
   onGetTooltip(element: Element, instance: Instance): Cx.Config;
}

export class FlyweightTooltipTracker extends Cx.Widget<FlyweightTooltipTrackerProps> {}
