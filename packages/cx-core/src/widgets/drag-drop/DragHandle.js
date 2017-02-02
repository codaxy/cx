import { Widget, VDOM } from '../../ui/Widget';
import { PureContainer } from '../../ui/PureContainer';
import { ddHandle } from '../drag-drop/ops';

export class DragHandle extends PureContainer {

   explore(context, instance) {
      if (Array.isArray(context.dragHandles))
         context.dragHandles.push(instance);
      super.explore(context, instance);
   }

   render(context, instance, key) {
      let {data} = instance;
      return (
         <div
            className={data.classNames}
            style={data.style}
            onTouchStart={ddHandle}
            onMouseDown={ddHandle}
            onTouchMove={ddHandle}
            onMouseMove={ddHandle}
            onTouchEnd={ddHandle}
            onMouseUp={ddHandle}
         >
            {this.renderChildren(context, instance)}
         </div>
      )
   }
}

DragHandle.prototype.styled = true;
Widget.alias('draghandle', DragHandle);
