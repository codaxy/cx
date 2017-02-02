import { Widget, VDOM } from '../../ui/Widget';
import { PureContainer } from '../../ui/PureContainer';
import { parseStyle } from '../../util/parseStyle';
import { registerDropZone } from './ops';

export class DropZone extends PureContainer {

   init() {
      this.overStyle = parseStyle(this.overStyle);
      this.nearStyle = parseStyle(this.nearStyle);
      this.farStyle = parseStyle(this.farStyle);
      super.init();
   }

   declareData() {
      return super.declareData(...arguments, {
         overClass: {structured: true},
         nearClass: {structured: true},
         farClass: {structured: true},
         overStyle: {structured: true},
         nearStyle: {structured: true},
         farStyle: {structured: true},
      })
   }

   render(context, instance, key) {
      return <DropZoneComponent key={key} instance={instance}>
         {this.renderChildren(context, instance)}
      </DropZoneComponent>
   }
}

DropZone.prototype.styled = true;
DropZone.prototype.nearDistance = 0;
DropZone.prototype.inflate = 0;
DropZone.prototype.baseClass = 'dropzone';

Widget.alias('dropzone', DropZone);

class DropZoneComponent extends VDOM.Component {

   constructor(props) {
      super(props);
      this.state = {
         state: false
      };
   }

   render() {
      let {instance, children} = this.props;
      let {data, widget} = instance;
      let {CSS} = widget;

      let classes = [
         data.classNames,
         CSS.state(this.state.state)
      ];

      let stateStyle;

      switch  (this.state.state) {
         case 'over':
            classes.push(data.overClass);
            stateStyle = parseStyle(data.overStyle);
            break;
         case 'near':
            classes.push(data.nearClass);
            stateStyle = parseStyle(data.nearStyle);
            break;
         case 'far':
            classes.push(data.farClass);
            stateStyle = parseStyle(data.farStyle);
            break;
      }

      return (
         <div
            className={CSS.expand(classes)}
            style={{...data.style, ...this.state.style, ...stateStyle}}
            ref={el=>{this.el = el;}}
         >
            {children}
         </div>
      )
   }

   componentDidMount() {
      this.unregister = registerDropZone(this);
   }

   componentWillUnmount() {
      this.unregister();
   }

   onDropTest(e) {
      let {widget} = this.props.instance;
      return !widget.onDropTest || widget.onDropTest(e);
   }

   onDragStart(e) {
      this.initialWidth = this.el.offsetWidth;
      this.initialHeight = this.el.offsetHeight;
      this.setState({
         state: 'far'
      });
   }

   onDragNear(e) {
      this.setState({
         state: 'near'
      });
   }

   onDragAway(e) {
      this.setState({
         state: 'far'
      })
   }

   onDragLeave(e) {
      let {nearDistance} = this.props.instance.widget;
      this.setState({
         state: nearDistance ? 'near' : 'far',
         style: null
      })
   }

   onDragMeasure(e) {

      let r = this.el.getBoundingClientRect();
      let rect = {
         left: r.left,
         right: r.right,
         top: r.top,
         bottom: r.bottom
      };

      let {instance} = this.props;
      let {widget} = instance;

      if (widget.inflate > 0) {
         rect.left -= widget.inflate;
         rect.top -= widget.inflate;
         rect.bottom += widget.inflate;
         rect.right += widget.inflate;
      }

      let {clientX, clientY} = e.cursor;
      let {nearDistance} = widget;

      let centerDistance = Math.abs((rect.left + rect.right) / 2 - clientX) + Math.abs((rect.top + rect.bottom) / 2 - clientY);

      let over = rect.left <= clientX && clientX < rect.right && rect.top <= clientY && clientY < rect.bottom;

      return {
         over: over && centerDistance,
         near: nearDistance && (over || Math.max(0, rect.left - clientX, clientX - rect.right) + Math.max(0, rect.top - clientY, clientY - rect.bottom) < nearDistance)
      };
   }

   onDragOver(e) {

      let {instance} = this.props;
      let {widget} = instance;
      let style = {};

      if (widget.matchWidth)
         style.width = `${e.source.width}px`;

      if (widget.matchHeight)
         style.height = `${e.source.height}px`;

      if (widget.matchMargin)
         style.margin = e.source.margin.join(' ');

      if (this.state != 'over')
         this.setState({
            state: 'over',
            style
         });
   }

   onDrop(e) {
      let {instance} = this.props;
      let {widget} = instance;

      if (this.state.state == 'over' && typeof widget.onDrop == 'function') {
         widget.onDrop(e, instance);
      }
   }

   onDragEnd(e) {
      this.setState({
         state: false,
         style: null
      });
   }
}

