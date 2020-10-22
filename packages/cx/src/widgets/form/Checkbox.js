import { Widget, VDOM, getContent } from "../../ui/Widget";
import { Field, getFieldTooltip } from "./Field";
import { tooltipMouseMove, tooltipMouseLeave } from "../overlay/tooltip-ops";
import { stopPropagation } from "../../util/eventCallbacks";
import { KeyCode } from "../../util/KeyCode";
import CheckIcon from "../icons/check";
import SquareIcon from "../icons/square";

export class Checkbox extends Field {
   init() {
      if (this.checked) this.value = this.checked;

      super.init();
   }

   declareData() {
      super.declareData(
         {
            value: !this.indeterminate ? false : undefined,
            text: undefined,
            readOnly: undefined,
            disabled: undefined,
            enabled: undefined,
            required: undefined,
         },
         ...arguments
      );
   }

   renderWrap(context, instance, key, content) {
      let { data } = instance;
      return (
         <label
            key={key}
            className={data.classNames}
            onMouseDown={stopPropagation}
            onMouseMove={(e) => tooltipMouseMove(e, ...getFieldTooltip(instance))}
            onMouseLeave={(e) => tooltipMouseLeave(e, ...getFieldTooltip(instance))}
            onClick={(e) => {
               this.handleClick(e, instance);
            }}
            style={data.style}
         >
            {content}
            {this.labelPlacement && getContent(this.renderLabel(context, instance, "label"))}
         </label>
      );
   }

   validateRequired(context, instance) {
      let { data } = instance;
      if (!data.value) return this.requiredText;
   }

   renderNativeCheck(context, instance) {
      let { CSS, baseClass } = this;
      let { data } = instance;
      return (
         <input
            key="input"
            className={CSS.element(baseClass, "checkbox")}
            id={data.id}
            type="checkbox"
            checked={data.value || false}
            disabled={data.disabled}
            {...data.inputAttrs}
            onClick={stopPropagation}
            onChange={(e) => {
               this.handleChange(e, instance);
            }}
         />
      );
   }

   renderCheck(context, instance) {
      return <CheckboxCmp key="check" instance={instance} data={instance.data} />;
   }

   renderInput(context, instance, key) {
      let { data } = instance;
      let text = data.text || this.renderChildren(context, instance);
      let { CSS, baseClass } = this;
      return this.renderWrap(context, instance, key, [
         this.native ? this.renderNativeCheck(context, instance) : this.renderCheck(context, instance),
         text ? (
            <div key="text" className={CSS.element(baseClass, "text")}>
               {text}
            </div>
         ) : (
            <span key="baseline" className={CSS.element(baseClass, "baseline")}>
               &nbsp;
            </span>
         ),
      ]);
   }

   formatValue(context, instance) {
      let { data } = instance;
      return data.value && (data.text || this.renderChildren(context, instance));
   }

   handleClick(e, instance) {
      if (this.native) e.stopPropagation();
      else {
         var el = document.getElementById(instance.data.id);
         if (el) el.focus();
         if (!instance.data.viewMode) {
            e.preventDefault();
            e.stopPropagation();
            this.handleChange(e, instance, !instance.data.value);
         }
      }
   }

   handleChange(e, instance, checked) {
      let { data } = instance;

      if (data.readOnly || data.disabled || data.viewMode) return;

      instance.set("value", checked != null ? checked : e.target.checked);
   }
}

Checkbox.prototype.baseClass = "checkbox";
Checkbox.prototype.native = false;
Checkbox.prototype.indeterminate = false;
Checkbox.prototype.unfocusable = false;

Widget.alias("checkbox", Checkbox);

class CheckboxCmp extends VDOM.Component {
   constructor(props) {
      super(props);
      this.state = {
         value: props.data.value,
      };
   }

   UNSAFE_componentWillReceiveProps(props) {
      this.setState({
         value: props.data.value,
      });
   }

   render() {
      let { instance, data } = this.props;
      let { widget } = instance;
      let { baseClass, CSS } = widget;

      let check = false;

      if (this.state.value == null && widget.indeterminate) check = "indeterminate";
      else if (this.state.value) check = "check";

      return (
         <span
            key="check"
            tabIndex={widget.unfocusable || data.disabled ? null : data.tabIndex || 0}
            className={CSS.element(baseClass, "input", {
               checked: check,
            })}
            style={CSS.parseStyle(data.inputStyle)}
            id={data.id}
            onClick={this.onClick.bind(this)}
            onKeyDown={this.onKeyDown.bind(this)}
         >
            {check == "check" && <CheckIcon className={CSS.element(baseClass, "input-check")} />}
            {check == "indeterminate" && <SquareIcon className={CSS.element(baseClass, "input-check")} />}
         </span>
      );
   }

   onClick(e) {
      let { instance, data } = this.props;
      let { widget } = instance;
      if (!data.disabled && !data.readOnly) {
         e.stopPropagation();
         e.preventDefault();
         this.setState({ value: !this.state.value });
         widget.handleChange(e, instance, !this.state.value);
      }
   }

   onKeyDown(e) {
      let { instance } = this.props;
      if (instance.widget.handleKeyDown(e, instance) === false) return;

      switch (e.keyCode) {
         case KeyCode.space:
            this.onClick(e);
            break;
      }
   }
}
