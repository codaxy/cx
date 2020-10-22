import { Widget, VDOM } from "../../ui/Widget";
import { Container } from "../../ui/Container";
import { ddMouseDown, ddDetect, ddMouseUp, initiateDragDrop, isDragHandleEvent } from "./ops";
import { preventFocus } from "../../ui/FocusManager";
import { parseStyle } from "../../util/parseStyle";

export class DragSource extends Container {
   init() {
      this.cloneStyle = parseStyle(this.cloneStyle);
      super.init();
   }

   declareData() {
      super.declareData(...arguments, {
         id: undefined,
         data: { structured: true },
         cloneStyle: { structured: true },
         cloneClass: { structured: true },
      });
   }

   explore(context, instance) {
      context.push("dragHandles", (instance.dragHandles = []));
      super.explore(context, instance);
   }

   exploreCleanup(context, instance) {
      context.pop("dragHandles");
   }

   render(context, instance, key) {
      return (
         <DragSourceComponent key={key} instance={instance} handled={this.handled || instance.dragHandles.length > 0}>
            {this.renderChildren(context, instance)}
         </DragSourceComponent>
      );
   }
}

DragSource.prototype.styled = true;
DragSource.prototype.baseClass = "dragsource";
DragSource.prototype.hideOnDrag = false;
DragSource.prototype.handled = false;

Widget.alias("dragsource", DragSource);

class DragSourceComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      this.state = { dragged: false };

      this.beginDragDrop = this.beginDragDrop.bind(this);
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseDown = this.onMouseDown.bind(this);
      this.setRef = (el) => {
         this.el = el;
      };
   }

   render() {
      let { instance, children, handled } = this.props;
      let { data, widget } = instance;
      let { CSS } = widget;

      if (this.state.dragged && widget.hideOnDrag) return null;

      let classes = [
         data.classNames,
         CSS.state({
            dragged: this.state.dragged,
            draggable: !handled,
         }),
      ];

      let eventHandlers = {
         ...instance.getJsxEventProps(),
         onTouchStart: this.onMouseDown,
         onMouseDown: this.onMouseDown,
         onTouchMove: this.onMouseMove,
         onMouseMove: this.onMouseMove,
         onTouchEnd: ddMouseUp,
         onMouseUp: ddMouseUp,
      };

      delete eventHandlers.onDragStart;
      delete eventHandlers.onDragEnd;

      return (
         <div id={data.id} ref={this.setRef} className={CSS.expand(classes)} style={data.style} {...eventHandlers}>
            {children}
         </div>
      );
   }

   onMouseDown(e) {
      ddMouseDown(e);
      if (isDragHandleEvent(e) || !this.props.handled) {
         preventFocus(e); //disables text selection in Firefox
         e.stopPropagation();
      }
   }

   onMouseMove(e) {
      if (ddDetect(e)) {
         if (isDragHandleEvent(e) || !this.props.handled) {
            this.beginDragDrop(e);
         }
      }
   }

   beginDragDrop(e) {
      let { instance } = this.props;
      let { data, widget, store } = instance;

      if (widget.onDragStart && instance.invoke("onDragStart", e, instance) === false) return;

      initiateDragDrop(
         e,
         {
            sourceEl: this.el,
            source: {
               store: store,
               data: data.data,
            },
            clone: {
               widget: widget.clone || widget,
               store,
               class: data.cloneClass,
               style: data.cloneStyle,
               cloneContent: !widget.clone,
               matchSize: !widget.clone,
               matchCursorOffset: !widget.clone,
            },
         },
         (e) => {
            this.setState({
               dragged: false,
            });
            if (widget.onDragEnd) instance.invoke("onDragEnd", e, instance);
         }
      );

      this.setState({
         dragged: true,
      });
   }
}
