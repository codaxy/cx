import {Widget, VDOM} from '../Widget';
import {Field} from './Field';
import {captureMouseOrTouch, getCursorPos} from '../overlay/captureMouse';
import {hslToRgb} from '../../util/color/hslToRgb';
import {rgbToHsl} from '../../util/color/rgbToHsl';
import {rgbToHex} from '../../util/color/rgbToHex';
import {parseColor} from '../../util/color/parseColor';
import {getVendorPrefix} from '../../util/getVendorPrefix';
import {stopPropagation} from '../eventCallbacks';

//TODO: Increase HSL precision in calculations, round only RGB values
//TODO: Resolve alpha input problems

export class ColorPicker extends Field {

   declareData() {
      super.declareData({
         value: undefined
      }, ...arguments);
   }

   renderInput(context, instance, key) {
      return <ColorPickerComponent key={key} instance={instance}/>
   }

   handleEvent(eventType, instance, color) {
      var {store} = instance;
      if (this.reportOn.indexOf(eventType) != -1) {
         var value;
         switch (this.format) {
            case 'rgba':
               value = `rgba(${color.r.toFixed(0)},${color.g.toFixed(0)},${color.b.toFixed(0)},${Math.round(color.a * 100) / 100})`;
               break;

            case 'hsla':
               value = `hsla(${color.h.toFixed(0)},${color.s.toFixed(0)},${color.l.toFixed(0)},${Math.round(color.a * 100) / 100})`;
               break;

            case 'hex':
               value = rgbToHex(color.r, color.g, color.b);
               break;
         }
         instance.set('value', value);
      }
   }
}

ColorPicker.prototype.baseClass = 'colorpicker';
ColorPicker.prototype.reportOn = 'blur change';
ColorPicker.prototype.format = 'rgba';

Widget.alias('color-picker', ColorPicker);

class ColorPickerComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      this.data = props.instance.data;
      this.state = this.parse(props.instance.data.value);
   }

   componentWillReceiveProps(props) {
      var {data} = props.instance;
      var color = this.parse(data.value);
      if (color.r != this.state.r || color.g != this.state.g || color.b != this.state.b || color.a != this.state.a)
         this.setState(color);
   }

   parse(color) {
      var c = parseColor(color);
      if (c == null) {
         c = {
            type: 'rgba',
            r: 128,
            g: 128,
            b: 128,
            a: 0
         }
      }

      c.a = Math.round(c.a * 100) / 100;

      if (c.type == 'rgba') {
         var [h, s, l] = rgbToHsl(c.r, c.g, c.b);
         return {r: c.r, g: c.g, b: c.b, h, s, l, a: c.a};
      }

      if (c.type == 'hsla') {
         var [r, g, b] = rgbToHsl(c.h, c.s, c.l);
         return {r: r, g, b, h: c.h, s: c.s, l: c.l, a: c.a};
      }

      throw new Error(`Color ${color} parsing failed.`);
   }

   render() {
      var { h, s, l, a, r, g, b } = this.state;
      var {instance} = this.props;
      var {widget, data} = instance;
      var {CSS, baseClass} = widget;
      var hcolor = `hsl(${h},100%,50%)`;
      var hsl = `hsl(${h},${s}%,${l}%)`;
      var hsla = `hsla(${h.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(0)}%,${a})`;
      var rgb = `rgb(${r},${g},${b})`;
      var rgba = `rgba(${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)},${a})`;
      var hex = rgbToHex(r, g, b);

      var alphaGradient = `${getVendorPrefix('css')}linear-gradient(left, hsla(${h},${s}%,${l}%,0) 0%, hsla(${h},${s}%,${l}%,1) 100%)`;

      return <div className={data.classNames}
                  style={data.style}
                  onBlur={::this.onBlur}
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}>
         <div className={CSS.element(baseClass, 'picker')} style={{backgroundColor:hcolor}}
              onMouseDown={::this.onSLSelect}
              onTouchStart={::this.onSLSelect}>
            <div className={CSS.element(baseClass, 'indicator')} style={{
               left: `calc(${s}% - 4px)`,
               top: `calc(${100-l}% - 4px)`,
               borderColor: `rgba(${r < 128 ? 255 : 0}, ${g < 128 ? 255 : 0}, ${b < 128 ? 255 : 0}, 0.5)`
            }}></div>
         </div>
         <div className={CSS.element(baseClass, 'details')}>
            <div className={CSS.element(baseClass, 'hue')}
                 onMouseDown={::this.onHueSelect}
                 onTouchStart={::this.onHueSelect}
                 onWheel={e=>{this.onWheel(e, 'h', 10)}}>
               <div className={CSS.element(baseClass, 'indicator')} style={{
                  left: `calc(${h/3.6}% - 2px)`
               }}></div>
            </div>
            <div className={CSS.element(baseClass, 'inputs')}>
               <label>
                  {'H '}
                  <input value={h.toFixed(0)} onChange={e=>{this.onNumberChange(e, 'h')}} onWheel={e=>{this.onWheel(e, 'h', 10)}} />
               </label>
               <label>
                  {'S '}
                  <input value={s.toFixed(0)} onChange={e=>{this.onNumberChange(e, 's')}} onWheel={e=>{this.onWheel(e, 's', 5)}}/>
               </label>
               <label>
                  {'L '}
                  <input value={l.toFixed(0)} onChange={e=>{this.onNumberChange(e, 'l')}} onWheel={e=>{this.onWheel(e, 'l', 5)}}/>
               </label>
               <label>
                  {'A '}
                  <input value={a} onChange={e=>{this.onNumberChange(e, 'a')}} onWheel={e=>{this.onWheel(e, 'a', 0.1)}}/>
               </label>
            </div>
            <div className={CSS.element(baseClass, 'alpha')}
                 onMouseDown={::this.onAlphaSelect}
                 onTouchStart={::this.onAlphaSelect}
                 onWheel={e=>{this.onWheel(e, 'a', 0.1)}}>
               <div style={{background:alphaGradient}} />
               <div className={CSS.element(baseClass, 'indicator')} style={{
                  left: `calc(${a*100}% - 2px)`
               }}></div>
            </div>
            <div className={CSS.element(baseClass, 'inputs')}>
               <label>
                  {'R '}
                  <input value={r.toFixed(0)} onChange={e=>{this.onNumberChange(e, 'r')}} onWheel={e=>{this.onWheel(e, 'r', 5)}} />
               </label>
               <label>
                  {'G '}
                  <input value={g.toFixed(0)} onChange={e=>{this.onNumberChange(e, 'g')}} onWheel={e=>{this.onWheel(e, 'g', 5)}}/>
               </label>
               <label>
                  {'B '}
                  <input value={b.toFixed(0)} onChange={e=>{this.onNumberChange(e, 'b')}} onWheel={e=>{this.onWheel(e, 'b', 5)}}/>
               </label>
               <label>
                  {'A '}
                  <input value={a} onChange={e=>{this.onNumberChange(e, 'a')}} onWheel={e=>{this.onWheel(e, 'a', 0.1)}}/>
               </label>
            </div>
            <div className={CSS.element(baseClass, 'preview')}>
               <div className={CSS.element(baseClass, 'color')} >
                  <div style={{backgroundColor:hsla}}></div>
               </div>
               <div className={CSS.element(baseClass, 'values')}>
                  <input value={hsla} readOnly />
                  <input value={rgba} readOnly/>
                  <input value={hex} readOnly/>
               </div>
            </div>
         </div>
      </div>;
   }

   onHueSelect(e) {

      e.preventDefault();
      e.stopPropagation();

      var el = e.currentTarget;
      var bounds = el.getBoundingClientRect();

      var move = e=> {
         var pos = getCursorPos(e);
         var x = Math.max(0, Math.min(1, (pos.clientX + 1 - bounds.left) / el.offsetWidth));
         this.setColorProp({
            h: x * 360
         });
      };

      captureMouseOrTouch(e, move);
      move(e);
   }

   onAlphaSelect(e) {
      e.preventDefault();
      e.stopPropagation();

      var el = e.currentTarget;
      var bounds = el.getBoundingClientRect();

      var move = e=> {
         var pos = getCursorPos(e);
         var x = Math.max(0, Math.min(1, (pos.clientX + 1 - bounds.left) / el.offsetWidth));
         this.setColorProp({
            a: x
         });
      };

      captureMouseOrTouch(e, move);
      move(e);
   }

   onSLSelect(e) {
      e.preventDefault();
      e.stopPropagation();

      var el = e.currentTarget;
      var bounds = el.getBoundingClientRect();

      var move = e => {
         var pos = getCursorPos(e);
         var x = Math.max(0, Math.min(1, (pos.clientX + 1 - bounds.left) / el.offsetWidth));
         var y = Math.max(0, Math.min(1, (pos.clientY + 1 - bounds.top) / el.offsetWidth));
         var s = x;
         var l = 1 - y;
         this.setColorProp({
            s: s * 100,
            l: l * 100,
         });
      };

      captureMouseOrTouch(e, move);
      move(e);
   }

   setColorProp(props, value) {

      if (typeof props == 'string') {
         props = {
            [props]: value
         }
      }

      var state = {...this.state};

      for (var prop in props) {

         value = props[prop];

         switch (prop) {
            case 'h':
               state.h = Math.min(360, Math.max(0, value));
               [state.r, state.g, state.b] = hslToRgb(state.h, state.s, state.l);
               break;

            case 's':
               state.s = Math.min(100, Math.max(0, value));
               [state.r, state.g, state.b] = hslToRgb(state.h, state.s, state.l);
               break;

            case 'l':
               state.l = Math.min(100, Math.max(0, value));
               [state.r, state.g, state.b] = hslToRgb(state.h, state.s, state.l);
               break;

            case 'r':
            case 'g':
            case 'b':
               state[prop] = Math.round(Math.min(255, Math.max(0, value)));
               var [h, s, l] = rgbToHsl(state.r, state.g, state.b);
               state.h = h;
               state.s = s;
               state.l = l;
               break;

            case 'a':
               state.a = Math.round(100 * Math.min(1, Math.max(0, value))) / 100;
               break;
         }
      }

      this.setState(state, () => {
         this.props.instance.widget.handleEvent('change', this.props.instance, this.state);
      });
   }

   onNumberChange(e, prop) {
      e.preventDefault();
      e.stopPropagation();
      var number = parseFloat(e.target.value || '0');
      this.setColorProp(prop, number);
   }

   onWheel(e, prop, delta) {
      e.preventDefault();
      e.stopPropagation();
      var factor = e.deltaY < 0 ? 1 : -1;
      this.setColorProp(prop, this.state[prop] + delta * factor);
   }

   onBlur() {
      this.props.instance.widget.handleEvent('blur', this.props.instance, this.state);
   }
}

