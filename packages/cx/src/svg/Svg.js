import { Widget, VDOM } from '../ui/Widget';
import { BoundedObject } from './BoundedObject';
import { Rect } from './util/Rect';
import { ResizeManager } from '../ui/ResizeManager';
import { addEventListenerWithOptions } from '../util/addEventListenerWithOptions';

export class Svg extends BoundedObject {

   initState(context, instance) {
      var size = {
         width: 0,
         height: 0
      };
      instance.state = { size };
   }

   prepare(context, instance) {
      var size = instance.state.size;

      context.parentRect = new Rect({
         l: 0,
         t: 0,
         r: size.width,
         b: size.height
      });

      instance.clipRects = {};
      instance.clipRectId = 0;
      context.push('addClipRect', rect => {
         var id = `clip-${instance.id}-${++instance.clipRectId}`;
         instance.clipRects[id] = rect;
         return id;
      });
      super.prepare(context, instance);
   }

   prepareCleanup(context, instance) {
      super.prepareCleanup(context, instance);
      context.pop('addClipRect');
   }

   render(context, instance, key) {
      let eventHandlers = instance.getJsxEventProps();
      if (eventHandlers) {
         delete eventHandlers["onWheelActive"];
      }
      return (
         <SvgComponent
            key={key}
            instance={instance}
            data={instance.data}
            options={context.options}
            size={instance.state.size}
            eventHandlers={eventHandlers}
         >
            {this.renderChildren(context, instance)}
         </SvgComponent>
      )
   }
}

   Svg.prototype.anchors = '0 1 1 0';
   Svg.prototype.baseClass = 'svg';
   Svg.prototype.autoWidth = false;
   Svg.prototype.autoHeight = false;
   Svg.prototype.aspectRatio = 1.618;

function sameSize(a, b) {
   if (!a || !b)
      return false;

   return a.width == b.width && a.height == b.height;
}

class SvgComponent extends VDOM.Component {

   render() {
      var { instance, data, size, children, eventHandlers } = this.props;
      var { widget } = instance;

      var defs = [];
      for (var k in instance.clipRects) {
         let cr = instance.clipRects[k];
         defs.push(<clipPath key={k} id={k}>
            <rect x={cr.l} y={cr.t} width={Math.max(0, cr.width())} height={Math.max(0, cr.height())} />
         </clipPath>);
      }

      let style = data.style;
      if (widget.autoHeight)
         style = {
            ...style,
            height: `${size.height}px`
         };
      if (widget.autoWidth)
         style = {
            ...style,
            width: `${size.width}px`
         };

      //parent div is needed because clientWidth doesn't work on the svg element in FF

      return (
         <div
            ref={el => {
               this.el = el
            }}
            className={data.classNames} style={style}
            {...eventHandlers}
         >
            {
               size.width > 0 && size.height > 0 && (
                  <svg>
                     <defs>
                        {defs}
                     </defs>
                     {children}
                  </svg>
               )
            }
         </div>
      )
   }

   onResize() {

      let { instance } = this.props;
      let { widget } = this.props.instance;

      let size = {
         width: this.el.clientWidth,
         height: this.el.clientHeight
      };

      if (widget.autoHeight)
         size.height = size.width / widget.aspectRatio;

      if (widget.autoWidth)
         size.width = size.height * widget.aspectRatio;

      if (!sameSize(instance.state.size, size))
         instance.setState({
            size: size
         });
   }

   componentDidMount() {
      this.offResize = ResizeManager.trackElement(this.el, this.onResize.bind(this));
      this.onResize();
      if (this.props.instance.widget.onWheelActive) {
         this.offWheelActive = addEventListenerWithOptions(this.el.parentElement, "wheel", event => {
            let { instance } = this.props;
            instance.invoke("onWheelActive", event, instance);
         }, { passive: false });
      }
   }

   componentDidUpdate() {
      this.onResize();
   }

   componentWillUnmount() {
      this.offResize && this.offResize();
      this.offWheelActive && this.offWheelActive();
   }
}

Widget.alias('svg', Svg);