import { Widget, VDOM, getContent } from "../../ui/Widget";
import { HtmlElement } from "../HtmlElement";
import { Field, getFieldTooltip, autoFocus } from "./Field";
import {
   tooltipParentWillReceiveProps,
   tooltipParentWillUnmount,
   tooltipMouseMove,
   tooltipMouseLeave,
   tooltipParentDidMount,
} from "../overlay/tooltip-ops";
import { stopPropagation, preventDefault } from "../../util/eventCallbacks";
import DropdownIcon from "../icons/drop-down";
import ClearIcon from "../icons/clear";
import { Icon } from "../Icon";
import { Localization } from "../../ui/Localization";
import { isString } from "../../util/isString";
import { isDefined } from "../../util/isDefined";
import { KeyCode } from "../../util/KeyCode";

export class Select extends Field {
   declareData() {
      super.declareData(
         {
            value: undefined,
            disabled: undefined,
            enabled: undefined,
            required: undefined,
            placeholder: undefined,
            icon: undefined,
         },
         ...arguments
      );
   }

   init() {
      if (isDefined(this.hideClear)) this.showClear = !this.hideClear;
      if (this.alwaysShowClear) this.showClear = true;
      super.init();
   }

   renderInput(context, instance, key) {
      return (
         <SelectComponent
            key={key}
            instance={instance}
            multiple={this.multiple}
            select={(v) => this.select(v, instance)}
            label={this.labelPlacement && getContent(this.renderLabel(context, instance, "label"))}
            help={this.helpPlacement && getContent(this.renderHelp(context, instance, "help"))}
         >
            {this.renderChildren(context, instance)}
         </SelectComponent>
      );
   }

   convert(value) {
      if (value == this.nullString) return null;
      if (value == "true") return true;
      if (value == "false") return false;
      if (value.match(/^\d+(\.\d+)?$/)) return Number(value);
      return value;
   }

   select(value, instance) {
      if (this.convertValues && value != null) value = this.convert(value);
      instance.set("value", value);
   }

   add(item) {
      if (isString(item)) return;
      super.add(item);
   }
}

Select.prototype.baseClass = "select";
Select.prototype.multiple = false;
Select.prototype.convertValues = true;
Select.prototype.nullString = "";
Select.prototype.suppressErrorsUntilVisited = true;
Select.prototype.showClear = true;
Select.prototype.alwaysShowClear = false;
Select.prototype.icon = null;

Widget.alias("select", Select);
Localization.registerPrototype("cx/widgets/Select", Select);

class SelectComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      this.state = {
         visited: false,
         focus: false,
      };
   }

   render() {
      let { multiple, select, instance, label, help } = this.props;
      let { data, widget, state } = instance;
      let { CSS, baseClass } = widget;

      let icon = data.icon && (
         <div className={CSS.element(baseClass, "left-icon")}>
            {Icon.render(data.icon, { className: CSS.element(baseClass, "icon") })}
         </div>
      );

      let insideButton,
         readOnly = data.disabled || data.readOnly;

      if (
         widget.showClear &&
         !readOnly &&
         !this.props.multiple &&
         (widget.alwaysShowClear || !data.required) &&
         data.placeholder &&
         !data.empty
      ) {
         insideButton = (
            <div
               onMouseDown={preventDefault}
               onClick={(e) => this.onClearClick(e)}
               className={CSS.element(baseClass, "clear")}
            >
               <ClearIcon className={CSS.element(baseClass, "icon")} />
            </div>
         );
      } else {
         insideButton = (
            <div className={CSS.element(baseClass, "tool")}>
               <DropdownIcon className={CSS.element(baseClass, "icon")} />
            </div>
         );
      }

      let placeholder;
      if (data.placeholder) {
         placeholder = (
            <option value={widget.nullString} className={CSS.element(baseClass, "placeholder")} disabled hidden>
               {data.placeholder}
            </option>
         );
      }

      return (
         <div
            className={CSS.expand(
               data.classNames,
               CSS.state({
                  visited: state.visited,
                  icon: data.icon,
                  focus: this.state.focus,
                  error: state.visited && data.error,
                  empty: data.empty && !data.placeholder,
               })
            )}
            style={data.style}
            onMouseDown={stopPropagation}
            onTouchStart={stopPropagation}
         >
            <select
               id={data.id}
               ref={(el) => {
                  this.select = el;
               }}
               className={CSS.element(baseClass, "select")}
               style={data.inputStyle}
               value={data.value == null ? widget.nullString : String(data.value)}
               multiple={multiple}
               disabled={data.disabled}
               tabIndex={data.tabIndex}
               {...data.inputAttrs}
               onBlur={this.onBlur.bind(this)}
               onFocus={(e) => this.onFocus()}
               onKeyDown={this.onKeyDown.bind(this)}
               onChange={(e) => {
                  e.preventDefault();
                  select(e.target.value);
               }}
               onMouseMove={(e) => tooltipMouseMove(e, ...getFieldTooltip(instance))}
               onMouseLeave={(e) => tooltipMouseLeave(e, ...getFieldTooltip(instance))}
            >
               {placeholder}
               {this.props.children}
            </select>
            {insideButton}
            {icon}
            {label}
            {help}
         </div>
      );
   }

   onBlur() {
      this.props.instance.setState({ visited: true });
      if (this.state.focus)
         this.setState({
            focus: false,
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

   onClearClick(e) {
      e.preventDefault();
      e.stopPropagation();
      let { instance } = this.props;
      let { widget } = instance;
      instance.set("value", widget.emptyValue);
   }

   onKeyDown(e) {
      switch (e.keyCode) {
         case KeyCode.up:
         case KeyCode.down:
            e.stopPropagation();
            break;
      }
   }

   componentDidMount() {
      var { select } = this.props;
      select(this.select.value);
      tooltipParentDidMount(this.select, ...getFieldTooltip(this.props.instance));
      autoFocus(this.select, this);
   }

   componentDidUpdate() {
      autoFocus(this.select, this);
   }

   UNSAFE_componentWillReceiveProps(props) {
      tooltipParentWillReceiveProps(this.select, ...getFieldTooltip(props.instance));
   }
}

export class Option extends HtmlElement {
   declareData() {
      super.declareData(
         {
            value: undefined,
            disabled: undefined,
            enabled: undefined,
            selected: undefined,
            text: undefined,
         },
         ...arguments
      );
   }

   prepareData(context, { data }) {
      super.prepareData(...arguments);
      if (!data.empty) data.value = data.value.toString();
   }

   render(context, instance, key) {
      var { data } = instance;
      return (
         <option key={key} value={data.value}>
            {data.text || this.renderChildren(context, instance)}
         </option>
      );
   }
}

Widget.alias("option", Option);
