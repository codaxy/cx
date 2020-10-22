import { Widget, VDOM, getContent } from "../../ui/Widget";
import { Cx } from "../../ui/Cx";
import { Field, getFieldTooltip, autoFocus } from "./Field";
import { DateTimePicker } from "./DateTimePicker";
import { Calendar } from "./Calendar";
import { Culture } from "../../ui/Culture";
import { isTouchEvent } from "../../util/isTouchEvent";
import { isTouchDevice } from "../../util/isTouchDevice";
import { Dropdown } from "../overlay/Dropdown";
import { StringTemplate } from "../../data/StringTemplate";
import { zeroTime } from "../../util/date/zeroTime";
import { dateDiff } from "../../util/date/dateDiff";
import {
   tooltipParentWillReceiveProps,
   tooltipParentWillUnmount,
   tooltipMouseMove,
   tooltipMouseLeave,
   tooltipParentDidMount,
} from "../overlay/tooltip-ops";
import { KeyCode } from "../../util/KeyCode";
import { Localization } from "../../ui/Localization";
import DropdownIcon from "../icons/drop-down";
import { Icon } from "../Icon";
import ClearIcon from "../icons/clear";
import { stopPropagation } from "../../util/eventCallbacks";
import { Format } from "../../util/Format";
import { TimeList } from "./TimeList";

export class DateTimeField extends Field {
   declareData() {
      super.declareData(
         {
            value: null,
            disabled: undefined,
            readOnly: undefined,
            enabled: undefined,
            placeholder: undefined,
            required: undefined,
            minValue: undefined,
            minExclusive: undefined,
            maxValue: undefined,
            maxExclusive: undefined,
            format: undefined,
            icon: undefined,
            autoOpen: undefined,
         },
         ...arguments
      );
   }

   init() {
      if (typeof this.hideClear !== "undefined") this.showClear = !this.hideClear;

      if (this.alwaysShowClear) this.showClear = true;

      if (!this.format) {
         switch (this.segment) {
            case "datetime":
               this.format = "datetime;YYYYMMddhhmm";
               break;

            case "time":
               this.format = "time;hhmm";
               break;

            case "date":
               this.format = "date;yyyyMMMdd";
               break;
         }
      }
      super.init();
   }

   prepareData(context, instance) {
      let { data } = instance;

      if (data.value) {
         let date = new Date(data.value);
         if (isNaN(date.getTime())) data.formatted = String(data.value);
         else {
            // handle utc edge cases
            if (this.segment == "date") date = zeroTime(date);
            data.formatted = Format.value(date, data.format);
         }
         data.date = date;
      } else data.formatted = "";

      if (data.refDate) data.refDate = zeroTime(new Date(data.refDate));

      if (data.maxValue) data.maxValue = new Date(data.maxValue);

      if (data.minValue) data.minValue = new Date(data.minValue);

      if (this.segment == "date") {
         if (data.minValue) data.minValue = zeroTime(data.minValue);

         if (data.maxValue) data.maxValue = zeroTime(data.maxValue);
      }

      instance.lastDropdown = context.lastDropdown;

      super.prepareData(context, instance);
   }

   validate(context, instance) {
      super.validate(context, instance);
      var { data, widget } = instance;
      if (!data.error && data.date) {
         if (isNaN(data.date)) data.error = this.inputErrorText;
         else {
            let d;
            if (data.maxValue) {
               d = dateDiff(data.date, data.maxValue);
               if (d > 0) data.error = StringTemplate.format(this.maxValueErrorText, data.maxValue);
               else if (d == 0 && data.maxExclusive)
                  data.error = StringTemplate.format(this.maxExclusiveErrorText, data.maxValue);
            }
            if (data.minValue) {
               d = dateDiff(data.date, data.minValue);
               if (d < 0) data.error = StringTemplate.format(this.minValueErrorText, data.minValue);
               else if (d == 0 && data.minExclusive)
                  data.error = StringTemplate.format(this.minExclusiveErrorText, data.minValue);
            }
            if (widget.disabledDaysOfWeek) {
               if (widget.disabledDaysOfWeek.includes(data.date.getDay()))
                  data.error = this.disabledDaysOfWeekErrorText;
            }
         }
      }
   }

   renderInput(context, instance, key) {
      return (
         <DateTimeInput
            key={key}
            instance={instance}
            data={instance.data}
            picker={{
               value: this.value,
               minValue: this.minValue,
               maxValue: this.maxValue,
               minExclusive: this.minExclusive,
               maxExclusive: this.maxExclusive,
               maxValueErrorText: this.maxValueErrorText,
               maxExclusiveErrorText: this.maxExclusiveErrorText,
               minValueErrorText: this.minValueErrorText,
               minExclusiveErrorText: this.minExclusiveErrorText,
            }}
            label={this.labelPlacement && getContent(this.renderLabel(context, instance, "label"))}
            help={this.helpPlacement && getContent(this.renderHelp(context, instance, "help"))}
         />
      );
   }

   formatValue(context, { data }) {
      return data.value ? data.formatted : null;
   }

   parseDate(date, instance) {
      if (!date) return null;
      if (date instanceof Date) return date;
      if (this.onParseInput) {
         let result = instance.invoke("onParseInput", date, instance);
         if (result !== undefined) return result;
      }
      date = Culture.getDateTimeCulture().parse(date, { useCurrentDateForDefaults: true });
      return date;
   }
}

DateTimeField.prototype.baseClass = "datetimefield";
DateTimeField.prototype.maxValueErrorText = "Select {0:d} or before.";
DateTimeField.prototype.maxExclusiveErrorText = "Select a date before {0:d}.";
DateTimeField.prototype.minValueErrorText = "Select {0:d} or later.";
DateTimeField.prototype.minExclusiveErrorText = "Select a date after {0:d}.";
DateTimeField.prototype.inputErrorText = "Invalid date entered.";
DateTimeField.prototype.disabledDaysOfWeekErrorText = "Selected day of week is not allowed.";

DateTimeField.prototype.suppressErrorsUntilVisited = true;
DateTimeField.prototype.icon = "calendar";
DateTimeField.prototype.showClear = true;
DateTimeField.prototype.alwaysShowClear = false;
DateTimeField.prototype.reactOn = "enter blur";
DateTimeField.prototype.segment = "datetime";
DateTimeField.prototype.picker = "auto";
DateTimeField.prototype.disabledDaysOfWeek = null;

Widget.alias("datetimefield", DateTimeField);
Localization.registerPrototype("cx/widgets/DateTimeField", DateTimeField);

class DateTimeInput extends VDOM.Component {
   constructor(props) {
      super(props);
      props.instance.component = this;
      this.state = {
         dropdownOpen: false,
         focus: false,
      };
   }

   getDropdown() {
      if (this.dropdown) return this.dropdown;

      let { widget, lastDropdown } = this.props.instance;

      let pickerConfig;

      switch (widget.picker) {
         case "calendar":
            pickerConfig = {
               type: Calendar,
               partial: widget.partial,
               encoding: widget.encoding,
               disabledDaysOfWeek: widget.disabledDaysOfWeek,
            };
            break;

         case "list":
            pickerConfig = {
               type: TimeList,
               style: "height: 300px",
               encoding: widget.encoding,
               step: widget.step,
               format: widget.format,
               scrollSelectionIntoView: true,
            };
            break;

         default:
            pickerConfig = {
               type: DateTimePicker,
               segment: widget.segment,
               encoding: widget.encoding,
            };
            break;
      }

      let dropdown = {
         scrollTracking: true,
         inline: !isTouchDevice() || !!lastDropdown,
         matchWidth: false,
         placementOrder: "down down-right down-left up up-right up-left",
         touchFriendly: true,
         firstChildDefinesHeight: true,
         firstChildDefinesWidth: true,
         ...widget.dropdownOptions,
         type: Dropdown,
         relatedElement: this.input,
         onFocusOut: (e) => {
            this.closeDropdown(e);
         },
         items: {
            ...pickerConfig,
            ...this.props.picker,
            autoFocus: true,
            onKeyDown: (e) => this.onKeyDown(e),
            onSelect: (e) => {
               e.stopPropagation();
               e.preventDefault();
               let touch = isTouchEvent(e);
               this.closeDropdown(e, () => {
                  if (!touch) this.input.focus();
               });
            },
         },
      };

      return (this.dropdown = Widget.create(dropdown));
   }

   render() {
      let { instance, label, help } = this.props;
      let { data, widget, state } = instance;
      let { CSS, baseClass, suppressErrorsUntilVisited } = widget;

      let insideButton, icon;

      if (!data.readOnly && !data.disabled) {
         if (
            widget.showClear &&
            (((widget.alwaysShowClear || !data.required) && !data.empty) || instance.state.inputError)
         )
            insideButton = (
               <div
                  className={CSS.element(baseClass, "clear")}
                  onMouseDown={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                  }}
                  onClick={(e) => this.onClearClick(e)}
               >
                  <ClearIcon className={CSS.element(baseClass, "icon")} />
               </div>
            );
         else
            insideButton = (
               <div className={CSS.element(baseClass, "right-icon")}>
                  <DropdownIcon className={CSS.element(baseClass, "icon")} />
               </div>
            );
      }

      if (data.icon) {
         icon = (
            <div className={CSS.element(baseClass, "left-icon")}>
               {Icon.render(data.icon, { className: CSS.element(baseClass, "icon") })}
            </div>
         );
      }

      let dropdown = false;
      if (this.state.dropdownOpen)
         dropdown = (
            <Cx
               widget={this.getDropdown()}
               parentInstance={instance}
               options={{ name: "datefield-dropdown" }}
               subscribe
            />
         );

      let empty = this.input ? !this.input.value : data.empty;

      return (
         <div
            className={CSS.expand(
               data.classNames,
               CSS.state({
                  visited: state.visited,
                  focus: this.state.focus || this.state.dropdownOpen,
                  icon: !!icon,
                  empty: empty && !data.placeholder,
                  error: data.error && (state.visited || !suppressErrorsUntilVisited || !empty),
               })
            )}
            style={data.style}
            onMouseDown={this.onMouseDown.bind(this)}
            onTouchStart={stopPropagation}
         >
            <input
               id={data.id}
               ref={(el) => {
                  this.input = el;
               }}
               type="text"
               className={CSS.element(baseClass, "input")}
               style={data.inputStyle}
               defaultValue={data.formatted}
               disabled={data.disabled}
               readOnly={data.readOnly}
               tabIndex={data.tabIndex}
               placeholder={data.placeholder}
               {...data.inputAttrs}
               onInput={(e) => this.onChange(e, "input")}
               onChange={(e) => this.onChange(e, "change")}
               onKeyDown={(e) => this.onKeyDown(e)}
               onBlur={(e) => {
                  this.onBlur(e);
               }}
               onFocus={(e) => {
                  this.onFocus(e);
               }}
               onMouseMove={(e) => tooltipMouseMove(e, ...getFieldTooltip(this.props.instance))}
               onMouseLeave={(e) => tooltipMouseLeave(e, ...getFieldTooltip(this.props.instance))}
            />
            {icon}
            {insideButton}
            {dropdown}
            {label}
            {help}
         </div>
      );
   }

   onMouseDown(e) {
      e.stopPropagation();

      if (this.state.dropdownOpen) {
         this.closeDropdown(e);
      } else {
         this.openDropdownOnFocus = true;
      }

      //icon click
      if (e.target !== this.input) {
         e.preventDefault();
         if (!this.state.dropdownOpen) this.openDropdown(e);
         else this.input.focus();
      }
   }

   onFocus(e) {
      let { instance } = this.props;
      let { widget } = instance;
      if (widget.trackFocus) {
         this.setState({
            focus: true,
         });
      }
      if (this.openDropdownOnFocus) this.openDropdown(e);
   }

   onKeyDown(e) {
      let { instance } = this.props;
      if (instance.widget.handleKeyDown(e, instance) === false) return;

      switch (e.keyCode) {
         case KeyCode.enter:
            this.onChange(e, "enter");
            break;

         case KeyCode.esc:
            if (this.state.dropdownOpen) {
               e.stopPropagation();
               this.closeDropdown(e, () => {
                  this.input.focus();
               });
            }
            break;

         case KeyCode.left:
         case KeyCode.right:
            e.stopPropagation();
            break;

         case KeyCode.down:
            this.openDropdown(e);
            e.stopPropagation();
            e.preventDefault();
            break;
      }
   }

   onBlur(e) {
      if (!this.state.dropdownOpen) this.props.instance.setState({ visited: true });
      if (this.state.focus)
         this.setState({
            focus: false,
         });
      this.onChange(e, "blur");
   }

   closeDropdown(e, callback) {
      if (this.state.dropdownOpen) {
         if (this.scrollableParents)
            this.scrollableParents.forEach((el) => {
               el.removeEventListener("scroll", this.updateDropdownPosition);
            });

         this.setState({ dropdownOpen: false }, callback);
         this.props.instance.setState({ visited: true });
      } else if (callback) callback();
   }

   openDropdown() {
      let { data } = this.props.instance;
      this.openDropdownOnFocus = false;

      if (!this.state.dropdownOpen && !(data.disabled || data.readOnly)) {
         this.setState({
            dropdownOpen: true,
            dropdownOpenTime: Date.now(),
         });
      }
   }

   onClearClick(e) {
      this.setValue(null);
      e.stopPropagation();
      e.preventDefault();
   }

   UNSAFE_componentWillReceiveProps(props) {
      let { data, state } = props.instance;
      if (data.formatted !== this.input.value && (data.formatted !== this.props.data.formatted || !state.inputError)) {
         this.input.value = data.formatted || "";
         props.instance.setState({
            inputError: false,
         });
      }

      tooltipParentWillReceiveProps(this.input, ...getFieldTooltip(this.props.instance));
   }

   componentDidMount() {
      tooltipParentDidMount(this.input, ...getFieldTooltip(this.props.instance));
      autoFocus(this.input, this);
      if (this.props.data.autoOpen) this.openDropdown();
   }

   componentDidUpdate() {
      autoFocus(this.input, this);
   }

   componentWillUnmount() {
      tooltipParentWillUnmount(this.props.instance);
   }

   onChange(e, eventType) {
      let { instance, data } = this.props;
      let { widget } = instance;

      if (data.disabled || data.readOnly) return;

      if (widget.reactOn.indexOf(eventType) === -1) return;

      if (eventType == "enter") instance.setState({ visited: true });

      this.setValue(e.target.value, data.value);
   }

   setValue(text, baseValue) {
      let { instance, data } = this.props;
      let { widget } = instance;

      let date = widget.parseDate(text, instance);

      instance.setState({
         inputError: isNaN(date) && widget.inputErrorText,
      });

      if (!isNaN(date)) {
         let mixed = new Date(baseValue);
         if (date && baseValue && !isNaN(mixed) && widget.partial) {
            switch (widget.segment) {
               case "date":
                  mixed.setFullYear(date.getFullYear());
                  mixed.setMonth(date.getMonth());
                  mixed.setDate(date.getDate());
                  break;

               case "time":
                  mixed.setHours(date.getHours());
                  mixed.setMinutes(date.getMinutes());
                  mixed.setSeconds(date.getSeconds());
                  break;

               default:
                  mixed = date;
                  break;
            }

            date = mixed;
         }

         let encode = widget.encoding || Culture.getDefaultDateEncoding();

         let value = date ? encode(date) : widget.emptyValue;

         if (!instance.set("value", value)) this.input.value = text || "";
      }
   }
}
