import * as Cx from "../core";
import { BoundedObject, BoundedObjectProps } from "../svg/BoundedObject";
import { PropertySelection, KeySelection } from "../ui/selection";

interface PieChartProps extends BoundedObjectProps {
   /** Angle in degrees. Default is `360` which represents the full circle. */
   angle?: Cx.NumberProp;

   /** Start angle in degrees. Indicates the starting point of the first stack. Default is `0`. */
   startAngle?: Cx.NumberProp;

   /** When set to `true`, stacks are rendered in clock wise direction. */
   clockwise?: Cx.BooleanProp;
}

export class PieChart extends Cx.Widget<PieChartProps> { }

interface PieSliceProps extends Cx.StyledContainerProps {
   /** Used to indicate whether an item is active or not. Inactive items are shown only in the legend. */
   active?: Cx.BooleanProp;

   /**
    * Inner pie radius in percents of the maximum available radius.
    *  If `percentageRadius` flag is set to false, then the value represents the radius in pixels. Default is 0.
    */
   r0?: Cx.NumberProp;

   /**
    * Outer pie radius in percents of the maximum available radius.
    * If `percentageRadius` flag is set to false, then the value represents the radius in pixels. Default is 50.
    */
   r?: Cx.NumberProp;

   /** Index of a color from the standard palette of colors. 0-15. */
   colorIndex?: Cx.NumberProp;

   /** Used to automatically assign a color based on the `name` and the contextual `ColorMap` widget. */
   colorMap?: Cx.StringProp;

   /** Name used to resolve the color. If not provided, `name` is used instead. */
   colorName?: Cx.StringProp;

   /** Value in pixels to be used to explode the pie. */
   offset?: Cx.NumberProp;

   value?: Cx.StringProp;
   disabled?: Cx.BooleanProp;
   innerPointRadius?: Cx.NumberProp;
   outerPointRadius?: Cx.NumberProp;

   /** Name of the item as it will appear in the legend. */
   name?: Cx.StringProp;

   /** Multi-level pie charts consist of multiple stacks. Assign a unique name to each level. Default is `stack`. */
   stack?: Cx.StringProp;

   /** Name of the legend to be used. Default is `legend`. */
   legend?: Cx.StringProp;

   percentageRaidus?: boolean;

   /** Base CSS class to be applied to the element. Defaults to `pieslice`. */
   baseClass?: string;

   legendAction?: string;

   /** Tooltip configuration. For more info see Tooltips. */
   tooltip?: Cx.StringProp | Cx.StructuredProp;

   /** Selection configuration. */
   selection?: { type: typeof PropertySelection | typeof KeySelection;[prop: string]: any };

   /** A value used to identify the group of components participating in hover effect synchronization. */
   hoverChannel?: string;

   /** A value used to uniquely identify the record within the hover sync group. */
   hoverId?: Cx.StringProp;
}

export class PieSlice extends Cx.Widget<PieSliceProps> { }
