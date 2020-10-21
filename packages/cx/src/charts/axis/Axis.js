import { BoundedObject } from '../../svg/BoundedObject'
import { VDOM } from '../../ui/Widget';
import { isUndefined } from '../../util/isUndefined';

export class Axis extends BoundedObject {

   init() {
      if (this.labelAnchor == 'auto')
         this.labelAnchor = this.vertical ? this.secondary ? 'start' : 'end' : 'middle';

      if (this.labelDx == 'auto')
         this.labelDx = 0;

      if (this.labelDy == 'auto')
         this.labelDy = this.vertical ? '0.4em' : this.secondary ? 0 : '0.8em';

      if (isUndefined(this.minLabelDistance))
         this.minLabelDistance = this.vertical ? this.minLabelDistanceVertical : this.minLabelDistanceHorizontal;

      if (this.labelLineCountDyFactor == 'auto')
         this.labelLineCountDyFactor = this.vertical ? -0.5 : this.secondary ? -1 : 0;

      super.init();
   }

   declareData() {
      super.declareData({
         anchors: undefined,
         hideLabels: undefined,
         labelRotation: undefined,
         labelAnchor: undefined
      }, ...arguments)
   }

   report(context, instance) {
      return instance.calculator;
   }

   renderTicksAndLabels(context, instance, valueFormatter) {

      if (this.hidden)
         return false;

      var { data, calculator } = instance;
      var { bounds } = data;
      var size = calculator.findTickSize(this.minLabelDistance);

      var labelClass = this.CSS.element(this.baseClass, 'label');
      var offsetClass = this.CSS.element(this.baseClass, 'label-offset');

      var x1, y1, x2, y2, tickSize = this.tickSize;

      if (this.vertical) {
         x1 = x2 = this.secondary ? bounds.r : bounds.l;
         y1 = bounds.b;
         y2 = bounds.t;
      } else {
         x1 = bounds.l;
         x2 = bounds.r;
         y1 = y2 = this.secondary ? bounds.t : bounds.b;
      }

      var res = [
         <line key="line"
            className={this.CSS.element(this.baseClass, "line")}
            x1={x1} y1={y1} x2={x2} y2={y2} />,
         null
      ];
      var t = [];
      if (size > 0 && !data.hideLabels) {
         var ticks = calculator.getTicks([size]);
         ticks.forEach((serie, si) => {
            serie.forEach((v, i) => {
               var s = calculator.map(v);

               if (this.secondary) {
                  x1 = this.vertical ? bounds.r : s;
                  y1 = this.vertical ? s : bounds.t;
                  x2 = this.vertical ? bounds.r + tickSize : s;
                  y2 = this.vertical ? s : bounds.t - tickSize;
               } else {
                  x1 = this.vertical ? bounds.l : s;
                  y1 = this.vertical ? s : bounds.b;
                  x2 = this.vertical ? bounds.l - tickSize : s;
                  y2 = this.vertical ? s : bounds.b + tickSize;
               }

               t.push(`M ${x1} ${y1} L ${x2} ${y2}`);

               var x, y;
               if (this.secondary) {
                  x = this.vertical ? bounds.r + this.labelOffset : s;
                  y = this.vertical ? s : bounds.t - this.labelOffset;
               } else {
                  x = this.vertical ? bounds.l - this.labelOffset : s;
                  y = this.vertical ? s : bounds.b + this.labelOffset;
               }

               var transform = data.labelRotation ? `rotate(${data.labelRotation} ${x} ${y})` : null;
               res.push(
                  <text key={`label-${si}-${i}`}
                     className={labelClass}
                     x={x}
                     y={y}
                     dx={this.labelDx}
                     textAnchor={data.labelAnchor}
                     transform={transform}>
                     {this.wrapLines(valueFormatter(v), x, this.labelDy, offsetClass)}
                  </text>
               );
            });
         });
      }
      res[1] = <path key="ticks" className={this.CSS.element(this.baseClass, "ticks")} d={t.join(' ')} />;
      return res;
   }

   wrapLines(str, x, dy, offsetClass) {
      if (!this.labelWrap || typeof str != 'string')
         return <tspan x={x} dy={dy}>{str}</tspan>;

      let parts = str.split(' ');
      if (parts.length == 0)
         return null;

      let lines = [];
      let line = null;
      for (let i = 0; i < parts.length; i++) {
         if (!line)
            line = parts[i];
         else if (parts[i].length + line.length < this.labelMaxLineLength)
            line += ' ' + parts[i];
         else {
            lines.push(line);
            line = parts[i];
         }
      }
      lines.push(line);

      if (lines.length == 1)
         return <tspan x={x} dy={dy}>{str}</tspan>;

      let offset = this.labelLineCountDyFactor * (lines.length - 1);
      let result = [dy != null && <tspan key={-2} className={offsetClass} dy={dy}>_</tspan>];

      lines.forEach((p, i) => {
         result.push(<tspan key={i} dy={`${i == 0 ? offset : 1}em`} x={x}>{p}</tspan>)
      });

      return result;
   }

   prepare(context, instance) {
      super.prepare(context, instance);
      var { bounds } = instance.data;
      var [a, b] = !this.vertical ? [bounds.l, bounds.r] : [bounds.b, bounds.t];
      instance.calculator.measure(a, b);
      if (!instance.calculator.isSame(instance.cached.axis))
         instance.markShouldUpdate(context);
   }

   cleanup(context, instance) {
      var { cached, calculator } = instance;
      cached.axis = calculator.hash();
   }
}

   Axis.prototype.anchors = '0 1 1 0';
   Axis.prototype.vertical = false;
   Axis.prototype.secondary = false;
   Axis.prototype.inverted = false;
   Axis.prototype.hidden = false;
   Axis.prototype.hideLabels = false;

   Axis.prototype.tickSize = 3;
   Axis.prototype.minTickDistance = 25;
   Axis.prototype.minLabelDistanceVertical = 40;
   Axis.prototype.minLabelDistanceHorizontal = 50;
   Axis.prototype.labelOffset = 10;
   Axis.prototype.labelRotation = 0;
   Axis.prototype.labelAnchor = 'auto';
   Axis.prototype.labelDx = 'auto';
   Axis.prototype.labelDy = 'auto';
   Axis.prototype.labelWrap = false;
   Axis.prototype.labelLineCountDyFactor = 'auto';
   Axis.prototype.labelMaxLineLength = 10;

   Axis.namespace = 'ui.svg.chart.axis';



