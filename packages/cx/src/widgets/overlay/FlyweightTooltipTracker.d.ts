import { Instance } from "../../ui/Instance";

export interface FlyweightTooltipTrackerProps extends Cx.WidgetProps {
   onGetTooltip(element: DOMElement, instance: Instance): Cx.Config;
}

export class FlyweightTooltipTracker extends Cx.Widget<FlyweightTooltipTrackerProps> {}
