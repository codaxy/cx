import * as Cx from '../../core';
import { FieldProps } from './Field';

interface LookupFieldProps extends FieldProps {

   /** Defaults to `false`. Set to `true` to enable multiple selection. */
   multiple?: Cx.BooleanProp,

   /** Selected value. Used only if `multiple` is set to `false`. */
   value?: Cx.Prop<number | string>,

   /** A list of selected ids. Used only if `multiple` is set to `true`. */
   values?: Cx.Prop<any[]>,

   /** A list of selected records. Used only if `multiple` is set to `true`. */
   records?: Cx.RecordsProp,

   /** Text associated with the selection. Used only if `multiple` is set to `false`. */
   text?: Cx.StringProp,

   /** The opposite of `disabled`. */
   enabled?: Cx.BooleanProp,

   /** Default text displayed when the field is empty. */
   placeholder?: Cx.StringProp,

   /** A list of available options. */
   options?: Cx.RecordsProp,

   /**
    * Set to `true` to hide the clear button. It can be used interchangeably with the `showClear` property.
    * No effect if `multiple` is used. Default value is `false`.
    */
   hideClear?: boolean,

   /**
    * Set to `false` to hide the clear button. It can be used interchangeably with the `hideClear` property.
    * No effect if `multiple` is used. Default value is `true`.
    */
   showClear?: boolean,

   /**
    * Set to `true` to display the clear button even if `required` is set. Default is `false`.
    */
   alwaysShowClear?: boolean,

   /** Base CSS class to be applied to the field. Defaults to `lookupfield`. */
   baseClass?: string,

   /* TODO: Check type */

   /** Additional config to be applied to all items */
   itemsConfig?: any,

   /**
    * An array of objects describing the mapping of option data to store data.
    * Each entry must define `local`, `remote` bindings. `key: true` is used to indicate fields that are used in the primary key.
    */
   bindings?: any,

   /** A delay in milliseconds between the moment the user stops typing and when tha query is made. Default value is `150`. */
   queryDelay?: number,

   /** Minimal number of characters required before query is made. */
   minQueryLength?: number,

   /** Set to `true` to hide the search field. */
   hideSearchField?: boolean,

   /**
    * Number of options required to show the search field.
    * If there are only a few options, there is no need for search. Defaults to `7`.
    */
   minOptionsForSearchField?: number,

   /** Text to display while data is being loaded. */
   loadingText?: string,

   /** Error message displayed to the user if server query throws an exception. */
   queryErrorText?: string,

   /** Message to be displayed if no entries match the user query. */
   noResultsText?: string,

   /** Name of the field which holds the id of the option. Default value is `id`. */
   optionIdField?: string,

   /** Name of the field which holds the display text of the option. Default value is `text`. */
   optionTextField?: string,

   /**
    * Available only in `multiple` selection mode and without custom `bindings`.
    * Name of the field to store id of the selected value. Default value is `id`.
    */
   valueIdField?: string,

   /**
    * Available only in `multiple` selection mode.
    * Name of the field to store display text of the selected value. Default value is `text`.
    */
   valueTextField?: string,

   /**
    * If `true` `onQuery` will be called only once to fetch all options.
    * After that options are filtered client-side.
    */
   fetchAll?: boolean,

   /**
    * If this flag is set along with `fetchAll`, fetched options are cached for the lifetime of the widget.
    * Otherwise, data is fetched whenever the dropdown is shown.
    */
   cacheAll?: boolean,

   /** Close the dropdown after selection. Default is `true`. */
   closeOnSelect?: boolean,

   /** Mesasge to be displayed to the user if the entered search query is too short. */
   minQueryLengthMessageText?: string,

   /** Name of the icon to be put on the left side of the input. */
   icon?: string,

   /** Query function. */
   onQuery?: string | (() => Cx.Record[]),

   /** Set to true to sort dropdown options. */
   sort?: boolean,

   /** Additional list options, such as grouping configuration, custom sorting, etc. */
   listOptions?: Cx.Config,

   /** Set to true to show the dropdown immediately after the component has mounted.
    * This is commonly used for cell editing in grids. */
   autoOpen?: Cx.BooleanProp,

   /** Set to true to allow enter key events to be propagated. This is useful for submitting forms or closing grid cell editors. */
   submitOnEnterKey?: Cx.BooleanProp,

   /** Set to true to allow dropdown enter key events to be propagated. This is useful for submitting forms on dropdown enter key selection. */
   submitOnDropdownEnterKey?: Cx.BooleanProp,

   /** Defaults to `false`. Used to make the field read-only. */
   readOnly?: Cx.BooleanProp,
}

export class LookupField extends Cx.Widget<LookupFieldProps> { }
