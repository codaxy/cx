import {Widget, VDOM, getContent} from '../Widget';
import {Field} from './Field';
import {Dropdown} from '../overlay/Dropdown';
import {ColorPicker} from './ColorPicker';
import {parseColor} from '../../util/color/parseColor';

import {tooltipComponentWillReceiveProps, tooltipComponentWillUnmount, tooltipMouseMove, tooltipMouseLeave, tooltipComponentDidMount} from '../overlay/Tooltip';
import {stopPropagation} from '../eventCallbacks';

export class ColorField extends Field {

   declareData() {
      super.declareData({
         value: undefined,
         disabled: undefined,
         readOnly: undefined,
         enabled: undefined,
         placeholder: undefined,
         required: undefined

      }, ...arguments);
   }

   prepareData(context, {data}) {
      super.prepareData(...arguments);
   }

   renderInput(context, instance, key) {
      return <ColorInput key={key}
                         instance={instance}
                         onSelect={ color => this.onSelect(instance, color) }
                         picker={{
                            value: this.value,
                            format: this.format
                         }}
      />
   }

   onSelect(instance, color) {
      instance.setState({
         inputError: false
      });
      instance.set('value', color || null);
   }
}

ColorField.prototype.baseClass = "colorfield";
ColorField.prototype.format = 'rgba';
ColorField.prototype.suppressErrorTooltipsUntilVisited = true;

Widget.alias('color-field', ColorField);

class ColorInput extends VDOM.Component {

   constructor(props) {
      super(props);
      var {data} = this.props.instance;
      this.data = data;
      this.state = {
         dropdownOpen: false,
         visited: data.visited
      };
   }

   getDropdown() {
      if (this.dropdown)
         return this.dropdown;

      var dropdown = {
         type: Dropdown,
         relatedElement: this.input,
         scrollTracking: true,
         autoFocus: true,
         inline: true,
         placementOrder: ' down down-left down-right up up-left up-right right right-up right-down left left-up left-down',
         items: {
            type: ColorPicker,
            ...this.props.picker
         },
         onFocusOut: () => {
            this.closeDropdown();
         }
      };

      return this.dropdown = Widget.create(dropdown);
   }

   render() {
      var {instance} = this.props;
      var {data, store, widget} = instance;
      var {CSS, baseClass} = widget;

      var insideButton = <div className={CSS.element(baseClass, 'icon')}>
         <div style={{backgroundColor: data.value}}></div>
      </div>;

      var dropdown = false;
      if (this.state.dropdownOpen)
         dropdown = instance.prepareRenderCleanupChild(this.getDropdown(), store, 'dropdown', {name: 'colorfield-dropdown'});

      return <div
         className={CSS.expand(data.classNames, CSS.state({visited: data.visited || this.state && this.state.visited}))}
         style={data.style}
         onMouseDown={::this.onMouseDown}
         onTouchStart={::this.onMouseDown}
         onClick={stopPropagation}>
         <input id={data.id}
                ref={el=>{this.input = el}}
                type="text"
                className={CSS.element(baseClass, 'input')}
                style={data.inputStyle}
                defaultValue={data.value}
                disabled={data.disabled}
                readOnly={data.readOnly}
                placeholder={data.placeholder}
                onInput={ e => this.onChange(e, 'input') }
                onChange={ e => this.onChange(e, 'change') }
                onKeyDown={ e => this.onKeyDown(e) }
                onBlur={ e => {
                   this.onBlur(e)
                } }
                onFocus={ e => {
                   this.onFocus(e)
                } }
                onMouseMove={e=>tooltipMouseMove(e, this.props.instance)}
                onMouseLeave={e=>tooltipMouseLeave(e, this.props.instance)}
         />
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
      if (this.openDropdownOnFocus)
         this.openDropdown(e);
   }

   onKeyDown(e) {

      switch (e.keyCode) {
         case 13:
            e.stopPropagation();
            this.onChange(e, 'enter');
            break;

         case 27: //esc
            if (this.state.dropdownOpen) {
               e.stopPropagation();
               this.closeDropdown(e, ()=> {
                  this.input.focus();
               });
            }
            break;

         case 37:
         case 39:
            e.stopPropagation();
            break;

         case 40: //down arrow
            this.openDropdown(e);
            e.stopPropagation();
            e.preventDefault();
            break;
      }
   }

   onBlur(e) {
      this.onChange(e, 'blur');
   }

   closeDropdown(e, callback) {
      if (this.state.dropdownOpen) {
         if (this.scrollableParents)
            this.scrollableParents.forEach(el => {
               el.removeEventListener('scroll', this.updateDropdownPosition)
            });

         this.setState({dropdownOpen: false}, callback);
      }
      else if (callback)
         callback();
   }

   openDropdown(e) {
      var {data} = this.props.instance;
      this.openDropdownOnFocus = false;

      if (!this.state.dropdownOpen && !(data.disabled || data.readOnly)) {
         this.setState({dropdownOpen: true});
      }
   }

   onClearClick(e) {
      this.props.onSelect(null);
      e.stopPropagation();
      e.preventDefault();
   }

   componentWillReceiveProps(props) {
      var {data, state} = props.instance;
      if (data.value != this.input.value) {
         this.input.value = data.value || '';
         props.instance.setState({
            inputError: false
         })
      }
      this.data = data;
      if (data.visited)
         this.setState({ visited: true });
      tooltipComponentWillReceiveProps(this.input, this.props.instance, this.state);
   }

   componentDidMount() {
      tooltipComponentDidMount(this.input, this.props.instance, this.state);
      if (this.props.instance.widget.autoFocus)
         this.input.focus();
   }

   componentWillUnmount() {
      tooltipComponentWillUnmount(this.input);
   }

   onChange(e, eventType) {

      if (eventType == 'blur')
         this.setState({visited: true});

      var value = e.target.value;
      var isValid;
      try {
         parseColor(value);
         isValid = true;
      }
      catch (e) {
         isValid = false;
      }

      if (eventType == 'blur' || eventType == 'enter') {
         if (value == null)
            this.props.onSelect(null);
         else if (isValid)
            this.props.onSelect(value);
         else
            this.props.instance.setState({
               inputError: 'Invalid color entered.'
            });
      }
   }
}
