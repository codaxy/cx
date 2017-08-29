import {PureContainer} from '../../ui/PureContainer';

export class PointReducer extends PureContainer {
   explore(context, instance) {
      let pointReducer = context.pointReducer;
      instance.parentPointTracker = pointReducer;

      if (!instance.pointReducer) {
         let onMap = this.onMap && instance.getCallback("onMap");
         let accumulator = {};
         instance.resetAccumulator = () => {
            accumulator = {};
            if (this.onInitAccumulator)
               instance.invoke('onInitAccumulator', accumulator, instance);
         };

         instance.pointReducer = (x, y, name) => {
            onMap(accumulator, x, y, name);
            if (pointReducer)
               pointReducer(x, y, name);
         };

         instance.write = () => {
            if (this.onReduce)
               instance.invoke('onReduce', accumulator, instance);
         }
      }

      instance.resetAccumulator();
      context.pointReducer = instance.pointReducer;

      super.explore(context, instance);
      context.pointReducer = pointReducer;
      instance.write();
   }
}
