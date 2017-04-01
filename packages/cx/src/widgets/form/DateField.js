import {Widget, VDOM} from '../../ui/Widget';
import {Cx} from '../../ui/Cx';
import {Field, getFieldTooltip} from './Field';
import {Calendar} from './Calendar';
import {Culture} from '../../ui/Culture';
import {isTouchEvent} from '../../util/isTouchEvent';
import {isTouchDevice} from '../../util';
import {Dropdown} from '../overlay/Dropdown';
import {StringTemplate} from '../../data/StringTemplate';
import {zeroTime} from '../../util/date/zeroTime';
import {dateDiff} from '../../util/date/dateDiff';
import {
   tooltipParentWillReceiveProps,
   tooltipParentWillUnmount,
   tooltipMouseMove,
   tooltipMouseLeave,
   tooltipParentDidMount
} from '../overlay/Tooltip';
import {KeyCode} from '../../util';
import {Localization} from '../../ui/Localization';
import CalendarIcon from '../icons/calendar';
import DropdownIcon from '../icons/drop-down';
import {Icon} from '../Icon';
import ClearIcon from '../icons/clear';
import {stopPropagation} from '../../util/eventCallbacks';

export class DateField extends Field {

   declareData() {
      super.declareData({
         value: undefined,
         disabled: undefined,
         readOnly: undefined,
         enabled: undefined,
         placeholder: undefined,
         required: undefined,
         minValue: undefined,
         minExclusive: undefined,
         maxValue: undefined,
         maxExclusive: undefined,
         format: undefined
      }, ...arguments);
   }

   init() {
      if (typeof this.hideClear != 'undefined')
         this.showClear = !this.hideClear;

      super.init();
   }

   prepareData(context, {data}) {
      super.prepareData(...arguments);

      if (data.value) {
         var date = new Date(data.value);
         data.formatted = Culture.getDateTimeCulture().format(date, data.format);
      }

      if (data.refDate)
         data.refDate = zeroTime(new Date(data.refDate));

      if (data.maxValue)
         data.maxValue = zeroTime(new Date(data.maxValue));

      if (data.minValue)
         data.minValue = zeroTime(new Date(data.minValue));

      super.prepareData(...arguments);
   }

   validate(context, instance) {
      super.validate(context, instance);
      var {data} = instance;
      if (!data.error && data.date) {
         var d;
         if (data.maxValue) {
            d = dateDiff(data.date, data.maxValue);
            if (d > 0)
               data.error = StringTemplate.format(this.maxValueErrorText, data.maxValue);
            else if (d == 0 && data.maxExclusive)
               data.error = StringTemplate.format(this.maxExclusiveErrorText, data.maxValue);
         }


         if (data.minValue) {
            d = dateDiff(data.date, data.minValue);
            if (d < 0)
               data.error = StringTemplate.format(this.minValueErrorText, data.minValue);
            else if (d == 0 && data.minExclusive)
               data.error = StringTemplate.format(this.minExclusiveErrorText, data.minValue);
         }
      }
   }

   renderInput(context, instance, key) {
      return <DateInput key={key}
                        instance={instance}
                        calendar={{
                           value: this.value,
                           minValue: this.minValue,
                           maxValue: this.maxValue,
                           minExclusive: this.minExclusive,
                           maxExclusive: this.maxExclusive,
                           maxValueErrorText: this.maxValueErrorText,
                           maxExclusiveErrorText: this.maxExclusiveErrorText,
                           minValueErrorText: this.minValueErrorText,
                           minExclusiveErrorText: this.minExclusiveErrorText
                        }}
      />
   }

   formatValue(context, {data}) {
      return data.value ? data.formatted : null;
   }

   parseDate(date) {
      if (!date)
         return null;
      if (date instanceof Date)
         return date;
      date = Culture.getDateTimeCulture().parse(date, {useCurrentDateForDefaults: true});
      return date;
   }
}

DateField.prototype.baseClass = "datefield";
DateField.prototype.memoize = false;

DateField.prototype.maxValueErrorText = 'Select {0:d} or before.';
DateField.prototype.maxExclusiveErrorText = 'Select a date before {0:d}.';
DateField.prototype.minValueErrorText = 'Select {0:d} or later.';
DateField.prototype.minExclusiveErrorText = 'Select a date after {0:d}.';
DateField.prototype.inputErrorText = 'Invalid date entered.';

DateField.prototype.suppressErrorTooltipsUntilVisited = true;
DateField.prototype.icon = 'calendar';
DateField.prototype.showClear = true;

Widget.alias('datefield', DateField);
Localization.registerPrototype('cx/widgets/DateField', DateField);

class DateInput extends VDOM.Component {

   constructor(props) {
      super(props);
      this.props.instance.component = this;
      let {data} = this.props.instance;
      this.data = data;
      this.state = {
         dropdownOpen: false,
         visited: data.visited,
         focus: false
      };
   }

   getDropdown() {
      if (this.dropdown)
         return this.dropdown;

      let dropdown = {
         type: Dropdown,
         relatedElement: this.input,
         scrollTracking: true,
         inline: true,
         matchWidth: false,
         placementOrder: 'down-right down down-left up-right up up-left',
         touchFriendly: true,
         items: {
            type: Calendar,
            ...this.props.calendar,
            autoFocus: true,
            onFocusOut: e => {
               this.closeDropdown(e);
            },
            onKeyDown: e => this.onKeyDown(e),
            onSelect: (e) => {
               e.stopPropagation();
               e.preventDefault();
               let touch = isTouchEvent(e);
               this.closeDropdown(e, () => {
                  if (!touch)
                     this.input.focus();
               });
            }
         },
         firstChildDefinesHeight: true,
         firstChildDefinesWidth: true
      };

      return this.dropdown = Widget.create(dropdown);
   }

   render() {
      let {instance} = this.props;
      let {data, store, widget} = instance;
      let {CSS, baseClass} = widget;

      let insideButton, icon;

      if (!data.readOnly && !data.disabled) {
         if (widget.showClear && !data.required && data.value != null)
            insideButton = (
               <div className={CSS.element(baseClass, 'clear')}
                    onMouseDown={e => {
                       e.preventDefault();
                       e.stopPropagation();
                    }}
                    onClick={ e => this.onClearClick(e) }>
                  <ClearIcon className={CSS.element(baseClass, 'icon')}/>
               </div>
            );
         else
            insideButton = (
               <div className={CSS.element(baseClass, 'right-icon')}>
                  <DropdownIcon className={CSS.element(baseClass, 'icon')}/>
               </div>
            );
      }

      if (widget.icon) {
         icon = (
            <div className={CSS.element(baseClass, 'left-icon')}>
               { Icon.render(widget.icon, {className: CSS.element(baseClass, 'icon')}) }
            </div>
         );
      }


      let dropdown = false;
      if (this.state.dropdownOpen)
         dropdown = <Cx widget={this.getDropdown()} parentInstance={instance} options={{name: 'datefield-dropdown'}}/>;

      return <div
         className={CSS.expand(data.classNames, CSS.state({
            visited: data.visited || this.state.visited,
            focus: this.state.focus
         }))}
         style={data.style}
         onMouseDown={::this.onMouseDown}
         onTouchStart={stopPropagation}>
         <input
            id={data.id}
            ref={el => {
               this.input = el
            }}
            type="text"
            className={CSS.element(baseClass, 'input')}
            style={data.inputStyle}
            defaultValue={data.formatted}
            disabled={data.disabled}
            readOnly={data.readOnly}
            placeholder={data.placeholder}
            {...data.inputAttrs}
            onInput={ e => this.onChange(e, 'input') }
            onChange={ e => this.onChange(e, 'change') }
            onKeyDown={ e => this.onKeyDown(e) }
            onBlur={ e => {
               this.onBlur(e)
            } }
            onFocus={ e => {
               this.onFocus(e)
            } }
            onMouseMove={e => tooltipMouseMove(e, ...getFieldTooltip(this.props.instance, this.state))}
            onMouseLeave={e => tooltipMouseLeave(e, ...getFieldTooltip(this.props.instance, this.state))}
         />
         { icon }
         { insideButton }
         { dropdown }
      </div>;
   }

   onMouseDown(e) {
      e.stopPropagation();

      if (this.state.dropdownOpen)
         this.closeDropdown(e);
      else {
         this.openDropdownOnFocus = true;
      }

      //icon click
      if (e.target != this.input) {
         e.preventDefault();
         if (!this.state.dropdownOpen)
            this.openDropdown(e);
         else
            this.input.focus();
      }
   }

   onFocus(e) {
      let {instance} = this.props;
      let {widget} = instance;
      if (widget.trackFocus) {
         this.setState({
            focus: true
         });
      }
      if (this.openDropdownOnFocus)
         this.openDropdown(e);
   }

   onKeyDown(e) {

      switch (e.keyCode) {
         case KeyCode.enter:
            e.stopPropagation();
            this.onChange(e, 'enter');
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
      if (!this.state.dropdownOpen)
         this.setState({visited: true});
      if (this.state.focus)
         this.setState({
            focus: false
         });
      this.onChange(e, 'blur');
   }

   closeDropdown(e, callback) {
      if (this.state.dropdownOpen) {
         if (this.scrollableParents)
            this.scrollableParents.forEach(el => {
               el.removeEventListener('scroll', this.updateDropdownPosition)
            });

         this.setState({dropdownOpen: false, visited: true}, callback);
      }
      else if (callback)
         callback();
   }

   openDropdown(e) {
      let {data} = this.props.instance;
      this.openDropdownOnFocus = false;

      if (!this.state.dropdownOpen && !(data.disabled || data.readOnly)) {
         this.setState({dropdownOpen: true});
      }
   }

   onClearClick(e) {
      this.setValue(null);
      e.stopPropagation();
      e.preventDefault();
   }

   componentWillReceiveProps(props) {
      let {data, state} = props.instance;
      if (data.formatted != this.input.value && (data.formatted != this.data.formatted || !state.inputError)) {
         this.input.value = data.formatted || '';
         props.instance.setState({
            inputError: false
         })
      }
      this.data = data;
      if (data.visited)
         this.setState({visited: true});
      tooltipParentWillReceiveProps(this.input, ...getFieldTooltip(this.props.instance, this.state));
   }

   componentDidMount() {
      tooltipParentDidMount(this.input, ...getFieldTooltip(this.props.instance, this.state));
      if (this.props.instance.data.autoFocus && !isTouchDevice())
         this.input.focus();
   }

   componentWillUnmount() {
      tooltipParentWillUnmount(this.props.instance);
   }

   onChange(e, eventType) {
      let {instance} = this.props;
      let {widget} = instance;

      let date = widget.parseDate(e.target.value);
      if (eventType == 'blur' || eventType == 'enter')
         this.setValue(date);
   }

   setValue(date) {
      let {instance} = this.props;
      let {widget} = instance;

      instance.setState({
         inputError: isNaN(date) && widget.inputErrorText
      });

      if (!isNaN(date))
         instance.set('value', date ? date.toISOString() : null);
   }
}
