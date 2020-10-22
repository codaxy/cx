import * as Cx from "../../core";
import { FieldProps } from "./Field";

interface CalendarProps extends FieldProps {
   /** Selected date. This should be a `Date` object or a valid date string consumable by `Date.parse` function. */
   value?: Cx.Prop<string | Date>;

   /** View reference date. If no date is selected, this date is used to determine which month to show in the calendar. */
   refDate?: Cx.Prop<string | Date>;

   /** Minimum date value. This should be a `Date` object or a valid date string consumable by `Date.parse` function. */
   minValue?: Cx.Prop<string | Date>;

   /** Set to `true` to disallow the `minValue`. Default value is `false`. */
   minExclusive?: Cx.BooleanProp;

   /** Maximum date value. This should be a `Date` object or a valid date string consumable by `Date.parse` function. */
   maxValue?: Cx.Prop<string | Date>;

   /** Set to `true` to disallow the `maxValue`. Default value is `false`. */
   maxExclusive?: Cx.BooleanProp;

   /** Base CSS class to be applied to the calendar. Defaults to `calendar`. */
   baseClass?: string;

   /** Highlight today's date. Default is true. */
   highlightToday?: boolean;

   /** Maximum value error text. */
   maxValueErrorText?: string;

   /** Maximum exclusive value error text. */
   maxExclusiveErrorText?: string;

   /** Minimum value error text. */
   minValueErrorText?: string;

   /** Minimum exclusive value error text. */
   minExclusiveErrorText?: string;

   /** The function that will be used to convert Date objects before writing data to the store.
    * Default implementation is Date.toISOString.
    * See also Culture.setDefaultDateEncoding.
    */
   encoding?: (date: Date) => any;

   /** Set to true to show the button for quickly selecting today's date.  */
   showTodayButton?: boolean;

   /** Localizable text for the todayButton. Defaults to `"Today"`. */
   todayButtonText?: string;

   /**  Defines which days of week should be displayed as disabled, i.e. `[0, 6]` will make Sunday and Saturday unselectable. */
   disabledDaysOfWeek?: number[]
}

export class Calendar extends Cx.Widget<CalendarProps> {}
