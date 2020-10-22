import * as Cx from '../../core';
import { FieldProps } from './Field';

export interface DateTimeFieldProps extends FieldProps {

   /** Selected date. This should be a Date object or a valid date string consumable by Date.parse function. */
   value?: Cx.Prop<string | Date>,

   /** Defaults to false. Used to make the field read-only. */
   readOnly?: Cx.BooleanProp,

   /** The opposite of `disabled`. */
   enabled?: Cx.BooleanProp,

   /** Default text displayed when the field is empty. */
   placeholder?: Cx.StringProp,

   /** Minimum date value. This should be a Date object or a valid date string consumable by Date.parse function. */
   minValue?: Cx.Prop<string | Date>,

   /** Set to `true` to disallow the `minValue`. Default value is `false`. */
   minExclusive?: Cx.BooleanProp,

   /** Maximum date value. This should be a Date object or a valid date string consumable by Date.parse function. */
   maxValue?: Cx.Prop<string | Date>,

   /** Set to `true` to disallow the `maxValue`. Default value is `false`. */
   maxExclusive?: Cx.BooleanProp,

   /** Date format used to display the selected date. See Formatting for more details. */
   format?: Cx.StringProp,

   /** Base CSS class to be applied to the field. Defaults to `datefield`. */
   baseClass?: string,

   /** Maximum value error text. */
   maxValueErrorText?: string,

   /** Maximum exclusive value error text. */
   maxExclusiveErrorText?: string,

   /** Minimum value error text. */
   minValueErrorText?: string,

   /** Minimum exclusive value error text. */
   minExclusiveErrorText?: string,

   /** Error message used to indicate wrong user input, e.g. invalid date entered. */
   inputErrorText?: string,

   /** Name of the icon to be put on the left side of the input. */
   icon?: string,

   /** Set to false to hide the clear button. It can be used interchangeably with the hideClear property. Default value is true. */
   showClear?: boolean,

   /**
    * Set to `true` to display the clear button even if `required` is set. Default is `false`.
    */
   alwaysShowClear?: boolean,

   /** Set to true to hide the clear button. It can be used interchangeably with the showClear property. Default value is false. */
   hideClear?: boolean,

   /** Determines which segment of date/time is used. Default value is `datetime`. */
   segment?: 'date' | 'time' | 'datetime',

   /** Set to `true` to indicate that only one segment of the selected date is affected. */
   partial?: boolean,

   /** The function that will be used to convert Date objects before writing data to the store.
    * Default implementation is Date.toISOString.
    * See also Culture.setDefaultDateEncoding.
    */
   encoding?: (date: Date) => any,

   /**  Defines which days of week should be displayed as disabled, i.e. `[0, 6]` will make Sunday and Saturday unselectable. */
   disabledDaysOfWeek?: number[]

}

export class DateTimeField extends Cx.Widget<DateTimeFieldProps> { }
