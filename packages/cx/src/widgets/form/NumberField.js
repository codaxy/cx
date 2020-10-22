import { Widget, VDOM, getContent } from "../../ui/Widget";
import { Field, getFieldTooltip, autoFocus } from "./Field";
import { Format } from "../../ui/Format";
import { Culture } from "../../ui/Culture";
import { StringTemplate } from "../../data/StringTemplate";
import {
   tooltipParentWillReceiveProps,
   tooltipParentWillUnmount,
   tooltipMouseMove,
   tooltipMouseLeave,
   tooltipParentDidMount,
} from "../overlay/tooltip-ops";
import { stopPropagation } from "../../util/eventCallbacks";
import { Icon } from "../Icon";
import { Localization } from "../../ui/Localization";
import ClearIcon from "../icons/clear";
import { isString } from "../../util/isString";
import { isNumber } from "../../util/isNumber";
import { isDefined } from "../../util/isDefined";

import { enableCultureSensitiveFormatting } from "../../ui/Format";
import { KeyCode } from "../../util/KeyCode";

enableCultureSensitiveFormatting();

export class NumberField extends Field {
   declareData() {
      super.declareData(
         {
            value: null,
            disabled: undefined,
            readOnly: undefined,
            enabled: undefined,
            placeholder: undefined,
            required: undefined,
            format: undefined,
            minValue: undefined,
            maxValue: undefined,
            minExclusive: undefined,
            maxExclusive: undefined,
            incrementPercentage: undefined,
            increment: undefined,
            icon: undefined,
            scale: undefined,
            offset: undefined,
         },
         ...arguments
      );
   }

   init() {
      if (isDefined(this.step)) this.increment = this.step;

      if (isDefined(this.hideClear)) this.showClear = !this.hideClear;

      if (this.alwaysShowClear) this.showClear = true;

      super.init();
   }

   prepareData(context, instance) {
      let { data, state, cached } = instance;
      data.formatted = Format.value(data.value, data.format);

      if (!cached.data || data.value != cached.data.value) state.empty = data.value == null;

      super.prepareData(context, instance);
   }

   formatValue(context, { data }) {
      return data.formatted;
   }

   parseValue(value, instance) {
      if (this.onParseInput) {
         let result = instance.invoke("onParseInput", value, instance);
         if (result !== undefined) return result;
      }
      return Culture.getNumberCulture().parse(value);
   }

   validate(context, instance) {
      super.validate(context, instance);

      let { data } = instance;
      if (isNumber(data.value) && !data.error) {
         if (isNumber(data.minValue)) {
            if (data.value < data.minValue)
               data.error = StringTemplate.format(this.minValueErrorText, Format.value(data.minValue, data.format));
            else if (data.value == data.minValue && data.minExclusive)
               data.error = StringTemplate.format(this.minExclusiveErrorText, Format.value(data.minValue, data.format));
         }

         if (isNumber(data.maxValue)) {
            if (data.value > data.maxValue)
               data.error = StringTemplate.format(this.maxValueErrorText, Format.value(data.maxValue, data.format));
            else if (data.value == data.maxValue && data.maxExclusive)
               data.error = StringTemplate.format(this.maxExclusiveErrorText, Format.value(data.maxValue, data.format));
         }
      }
   }

   renderInput(context, instance, key) {
      return (
         <Input
            key={key}
            data={instance.data}
            instance={instance}
            label={this.labelPlacement && getContent(this.renderLabel(context, instance, "label"))}
            help={this.helpPlacement && getContent(this.renderHelp(context, instance, "help"))}
         />
      );
   }

   validateRequired(context, instance) {
      return instance.state.empty && this.requiredText;
   }
}

NumberField.prototype.baseClass = "numberfield";
NumberField.prototype.reactOn = "enter blur";
NumberField.prototype.format = "n";
NumberField.prototype.inputType = "text";

NumberField.prototype.maxValueErrorText = "Enter {0} or less.";
NumberField.prototype.maxExclusiveErrorText = "Enter a number less than {0}.";
NumberField.prototype.minValueErrorText = "Enter {0} or more.";
NumberField.prototype.minExclusiveErrorText = "Enter a number greater than {0}.";
NumberField.prototype.inputErrorText = "Invalid number entered.";
NumberField.prototype.suppressErrorsUntilVisited = true;

NumberField.prototype.incrementPercentage = 0.1;
NumberField.prototype.scale = 1;
NumberField.prototype.offset = 0;
NumberField.prototype.snapToIncrement = true;
NumberField.prototype.icon = null;
NumberField.prototype.showClear = false;
NumberField.prototype.alwaysShowClear = false;

Widget.alias("numberfield", NumberField);
Localization.registerPrototype("cx/widgets/NumberField", NumberField);

class Input extends VDOM.Component {
   constructor(props) {
      super(props);
      this.state = {
         focus: false,
      };
   }

   render() {
      let { data, instance, label, help } = this.props;
      let { widget, state } = instance;
      let { CSS, baseClass, suppressErrorsUntilVisited } = widget;

      let icon = data.icon && (
         <div className={CSS.element(baseClass, "left-icon")}>
            {Icon.render(data.icon, { className: CSS.element(baseClass, "icon") })}
         </div>
      );

      let insideButton;
      if (!data.readOnly && !data.disabled) {
         if (
            widget.showClear &&
            (((widget.alwaysShowClear || !data.required) && !data.empty) || instance.state.inputError)
         )
            insideButton = (
               <div
                  className={CSS.element(baseClass, "clear")}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => this.onClearClick(e)}
               >
                  <ClearIcon className={CSS.element(baseClass, "icon")} />
               </div>
            );
      }

      let empty = this.input ? !this.input.value : data.empty;

      return (
         <div
            className={CSS.expand(
               data.classNames,
               CSS.state({
                  visited: state.visited,
                  focus: this.state.focus,
                  icon: !!icon,
                  empty: empty && !data.placeholder,
                  error: data.error && (state.visited || !suppressErrorsUntilVisited || !empty),
               })
            )}
            style={data.style}
            onMouseDown={stopPropagation}
            onTouchStart={stopPropagation}
         >
            <input
               id={data.id}
               type={widget.inputType}
               className={CSS.element(baseClass, "input")}
               defaultValue={data.formatted}
               ref={(el) => {
                  this.input = el;
               }}
               style={data.inputStyle}
               disabled={data.disabled}
               readOnly={data.readOnly}
               tabIndex={data.tabIndex}
               placeholder={data.placeholder}
               {...data.inputAttrs}
               onMouseMove={(e) => tooltipMouseMove(e, ...getFieldTooltip(this.props.instance))}
               onMouseLeave={(e) => tooltipMouseLeave(e, ...getFieldTooltip(this.props.instance))}
               onChange={(e) => this.onChange(e, "change")}
               onKeyDown={this.onKeyDown.bind(this)}
               onBlur={(e) => {
                  this.onChange(e, "blur");
               }}
               onFocus={(e) => this.onFocus()}
               onWheel={(e) => {
                  this.onChange(e, "wheel");
               }}
               onClick={stopPropagation}
            />
            {insideButton}
            {icon}
            {label}
            {help}
         </div>
      );
   }

   UNSAFE_componentWillReceiveProps(props) {
      let { data, state } = props.instance;
      if (this.props.data.formatted != data.formatted && !state.inputError) {
         this.input.value = props.data.formatted || "";
         props.instance.setState({
            inputError: false,
         });
      }
      tooltipParentWillReceiveProps(this.input, ...getFieldTooltip(props.instance));
   }

   componentDidMount() {
      tooltipParentDidMount(this.input, ...getFieldTooltip(this.props.instance));
      autoFocus(this.input, this);
   }

   componentDidUpdate() {
      autoFocus(this.input, this);
   }

   componentWillUnmount() {
      tooltipParentWillUnmount(this.props.instance);
   }

   getPreCursorDigits(text, cursor, decimalSeparator) {
      let res = "";
      for (let i = 0; i < cursor; i++) {
         if ("0" <= text[i] && text[i] <= "9") res += text[i];
         else if (text[i] == decimalSeparator) res += ".";
         else if (text[i] == "-") res += "-";
      }
      return res;
   }

   getLengthWithoutSuffix(text, decimalSeparator) {
      let l = text.length;
      while (l > 0) {
         if ("0" <= text[l - 1] && text[l - 1] <= "9") break;
         if (text[l - 1] == decimalSeparator) break;
         l--;
      }
      return l;
   }

   getDecimalSeparator(format) {
      let text = Format.value(0.11111111, format);
      for (let i = text.length - 1; i >= 0; i--) {
         if ("0" <= text[i] && text[i] <= "9") continue;
         if (text[i] == "," || text[i] == ".") return text[i];
         break;
      }
      return null;
   }

   updateCursorPosition(preCursorText) {
      if (isString(preCursorText)) {
         let cursor = 0;
         let preCursor = 0;
         let text = this.input.value || "";
         while (preCursor < preCursorText.length && cursor < text.length) {
            if (text[cursor] == preCursorText[preCursor]) {
               cursor++;
               preCursor++;
            } else {
               cursor++;
            }
         }
         this.input.setSelectionRange(cursor, cursor);
      }
   }

   calculateIncrement(value, strength) {
      if (value == 0) return 0.1;
      let absValue = Math.abs(value * strength);
      let log10 = Math.floor(Math.log10(absValue) + 0.001);
      let size = Math.pow(10, log10);
      if (absValue / size > 4.999) return 5 * size;
      if (absValue / size > 1.999) return 2 * size;
      return size;
   }

   onClearClick(e) {
      this.input.value = "";
      let { instance } = this.props;
      instance.set("value", instance.widget.emptyValue, { immedate: true });
   }

   onKeyDown(e) {
      let { instance } = this.props;
      if (instance.widget.handleKeyDown(e, instance) === false) return;

      switch (e.keyCode) {
         case KeyCode.enter:
            this.onChange(e, "enter");
            break;

         case KeyCode.left:
         case KeyCode.right:
            e.stopPropagation();
            break;
      }
   }

   onChange(e, change) {
      let { instance, data } = this.props;
      let { widget } = instance;

      if (data.required) {
         instance.setState({
            empty: !e.target.value,
         });
      }

      if (widget.reactOn.indexOf(change) == -1 || data.disabled || data.readOnly) return;

      let immedate = change == "blur" || change == "enter";

      if (immedate) instance.setState({ visited: true });

      if (change == "blur") {
         if (this.state.focus)
            this.setState({
               focus: false,
            });
      }

      let value = null;

      if (e.target.value) {
         let displayValue = widget.parseValue(e.target.value, instance);
         if (isNaN(displayValue)) {
            instance.setState({
               inputError: instance.widget.inputErrorText,
            });
            return;
         }

         value = displayValue * data.scale + data.offset;

         if (change == "wheel") {
            e.preventDefault();
            let increment =
               data.increment != null ? data.increment : this.calculateIncrement(value, data.incrementPercentage);
            value = value + (e.deltaY < 0 ? increment : -increment);
            if (widget.snapToIncrement) {
               value = Math.round(value / increment) * increment;
            }

            if (data.minValue != null) {
               if (data.minExclusive) {
                  if (value <= data.minValue) return;
               } else {
                  value = Math.max(value, data.minValue);
               }
            }

            if (data.maxValue != null) {
               if (data.maxExclusive) {
                  if (value >= data.maxValue) return;
               } else {
                  value = Math.min(value, data.maxValue);
               }
            }
         }

         let fmt = data.format;
         let decimalSeparator = this.getDecimalSeparator(fmt) || Format.value(1.1, "n;1")[1];

         let formatted = Format.value(value, fmt);
         //re-parse to avoid differences between formatted value and value in the store

         value = widget.parseValue(formatted, instance) * data.scale + data.offset;

         //allow users to type numbers like 100.0003 without interruptions
         //if the last typed in character is zero or dot (decimal separator) skip processing it
         if (
            change == "change" &&
            this.input.selectionStart == this.input.selectionEnd &&
            this.input.selectionEnd >= this.getLengthWithoutSuffix(this.input.value, decimalSeparator) &&
            (e.target.value[this.input.selectionEnd - 1] == decimalSeparator ||
               (e.target.value.indexOf(decimalSeparator) >= 0 && e.target.value[this.input.selectionEnd - 1] == "0"))
         )
            return;

         if (change != "blur") {
            //format, but keep the correct cursor position
            let preCursorText = this.getPreCursorDigits(this.input.value, this.input.selectionStart, decimalSeparator);
            this.input.value = formatted;
            this.updateCursorPosition(preCursorText);
         } else {
            this.input.value = formatted;
         }
      }

      instance.set("value", value, { immedate });

      instance.setState({
         inputError: false,
         visited: true,
      });
   }

   onFocus() {
      let { instance } = this.props;
      let { widget } = instance;
      if (widget.trackFocus) {
         this.setState({
            focus: true,
         });
      }
   }
}
