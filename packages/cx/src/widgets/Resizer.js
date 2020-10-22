import { Widget, VDOM } from "../ui/Widget";
import { captureMouseOrTouch, getCursorPos } from "./overlay/captureMouse";

export class Resizer extends Widget {
   declareData(...args) {
      super.declareData(...args, {
         size: undefined,
         defaultSize: undefined,
         minSize: undefined,
         maxSize: undefined,
      });
   }

   render(context, instance, key) {
      let { data } = instance;

      return <ResizerCmp key={key} instance={instance} data={data} />;
   }
}

Resizer.prototype.baseClass = "resizer";
Resizer.prototype.styled = true;
Resizer.prototype.horizontal = false;
Resizer.prototype.forNextElement = false;
Resizer.prototype.defaultSize = null;
Resizer.prototype.minSize = 0;
Resizer.prototype.maxSize = 1e6;

class ResizerCmp extends VDOM.Component {
   constructor(props) {
      super(props);
      this.state = {
         dragged: false,
         offset: 0,
      };
   }

   shouldComponentUpdate(props, state) {
      return state != this.state;
   }

   render() {
      let { instance, data } = this.props;
      let { widget } = instance;
      let { baseClass, CSS } = widget;

      return (
         <div
            ref={(el) => {
               this.el = el;
            }}
            className={CSS.expand(
               data.classNames,
               CSS.state({
                  vertical: !widget.horizontal,
                  horizontal: widget.horizontal,
               })
            )}
            style={data.style}
            onDoubleClick={(e) => {
               instance.set("size", data.defaultSize);
            }}
            onMouseDown={(e) => {
               let initialPosition = getCursorPos(e);
               this.setState({ dragged: true, initialPosition });
            }}
            onMouseUp={(e) => {
               this.setState({ dragged: false });
            }}
            onMouseMove={this.startCapture.bind(this)}
            onMouseLeave={this.startCapture.bind(this)}
         >
            <div
               className={CSS.element(baseClass, "handle", { dragged: this.state.dragged })}
               style={{
                  left: !widget.horizontal ? this.state.offset : 0,
                  top: widget.horizontal ? this.state.offset : 0,
               }}
            />
         </div>
      );
   }

   startCapture(e) {
      let { instance } = this.props;
      let { widget } = instance;

      if (this.state.dragged && !this.hasCapture) {
         this.hasCapture = true;
         captureMouseOrTouch(
            e,
            this.onHandleMove.bind(this),
            this.onDragComplete.bind(this),
            this.state.initialPosition,
            widget.horizontal ? "row-resize" : "col-resize"
         );
      }
   }

   onHandleMove(e, initialPosition) {
      let { instance } = this.props;
      let { widget } = instance;
      let currentPosition = getCursorPos(e);
      const offset = !widget.horizontal
         ? currentPosition.clientX - initialPosition.clientX
         : currentPosition.clientY - initialPosition.clientY;

      let size = this.getNewSize(0);
      let newSize = this.getNewSize(offset);

      let allowedOffset = widget.forNextElement ? size - newSize : newSize - size;

      this.setState({ offset: allowedOffset });
   }

   getNewSize(offset) {
      let { instance, data } = this.props;
      let { horizontal, forNextElement } = instance.widget;

      if (
         !this.el ||
         (!forNextElement && !this.el.previousElementSibling) ||
         (forNextElement && !this.el.nextElementSibling)
      )
         return 0;

      let newSize;

      if (horizontal) {
         if (forNextElement) newSize = this.el.nextElementSibling.offsetHeight - offset;
         else newSize = this.el.previousElementSibling.offsetHeight + offset;
      } else {
         if (forNextElement) newSize = this.el.nextElementSibling.offsetWidth - offset;
         else newSize = this.el.previousElementSibling.offsetWidth + offset;
      }

      return Math.max(data.minSize, Math.min(newSize, data.maxSize));
   }

   onDragComplete() {
      this.hasCapture = false;
      let { instance } = this.props;

      instance.set("size", this.getNewSize(this.state.offset));

      this.setState({
         dragged: false,
         offset: 0,
      });
   }
}
