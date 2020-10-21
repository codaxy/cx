import { Axis } from "./Axis";
import { VDOM } from "../../ui/Widget";
import { Stack } from "./Stack";
import { Format } from "../../util/Format";
import { isNumber } from "../../util/isNumber";

export class NumericAxis extends Axis {
   init() {
      if (this.deadZone) {
         this.lowerDeadZone = this.deadZone;
         this.upperDeadZone = this.deadZone;
      }
      super.init();
   }

   declareData() {
      super.declareData(...arguments, {
         min: undefined,
         max: undefined,
         normalized: undefined,
         inverted: undefined,
         labelDivisor: undefined,
         format: undefined,
         lowerDeadZone: undefined,
         upperDeadZone: undefined,
      });
   }

   initInstance(context, instance) {
      instance.calculator = new NumericScale();
   }

   explore(context, instance) {
      super.explore(context, instance);
      let { min, max, normalized, inverted, lowerDeadZone, upperDeadZone } = instance.data;
      instance.calculator.reset(
         min,
         max,
         this.snapToTicks,
         this.tickDivisions,
         this.minTickDistance,
         this.minTickStep,
         this.minLabelDistance,
         this.minLabelTickSize,
         normalized,
         inverted,
         lowerDeadZone,
         upperDeadZone
      );
   }

   render(context, instance, key) {
      let { data } = instance;

      if (!data.bounds.valid()) return null;

      let baseFormatter = Format.parse(data.format);
      let formatter = data.labelDivisor != 1 ? (v) => baseFormatter(v / data.labelDivisor) : baseFormatter;

      return (
         <g key={key} className={data.classNames} style={data.style}>
            {this.renderTicksAndLabels(context, instance, formatter)}
         </g>
      );
   }

   static XY() {
      return {
         x: { type: NumericAxis },
         y: { type: NumericAxis, vertical: true },
      };
   }
}

   NumericAxis.prototype.baseClass = "numericaxis";
   NumericAxis.prototype.tickDivisions =[
[1, 2, 10, 20, 100],
[1, 5, 10, 20, 100]
];

   NumericAxis.prototype.snapToTicks = 1;
   NumericAxis.prototype.normalized = false;
   NumericAxis.prototype.format = "n";
   NumericAxis.prototype.labelDivisor = 1;
   NumericAxis.prototype.minLabelTickSize = 0;
   NumericAxis.prototype.minTickStep = 0;

Axis.alias("numeric", NumericAxis);

class NumericScale {
   reset(
      min,
      max,
      snapToTicks,
      tickDivisions,
      minTickDistance,
      minTickStep,
      minLabelDistance,
      minLabelTickSize,
      normalized,
      inverted,
      lowerDeadZone,
      upperDeadZone
   ) {
      this.padding = 0;
      this.min = min;
      this.max = max;
      this.snapToTicks = snapToTicks;
      this.tickDivisions = tickDivisions;
      this.minLabelDistance = minLabelDistance;
      this.minLabelTickSize = minLabelTickSize;
      this.minTickDistance = minTickDistance;
      this.minTickStep = minTickStep;
      this.tickSizes = [];
      this.normalized = normalized;
      this.inverted = inverted;
      delete this.minValue;
      delete this.maxValue;
      this.stacks = {};
      this.lowerDeadZone = lowerDeadZone || 0;
      this.upperDeadZone = upperDeadZone || 0;
   }

   map(v, offset = 0) {
      return this.origin + (v + offset - this.scale.min + this.scale.minPadding) * this.scale.factor;
   }

   decodeValue(n) {
      return n;
   }

   encodeValue(v) {
      return v;
   }

   constrainValue(v) {
      return Math.max(this.scale.min, Math.min(this.scale.max, v));
   }

   trackValue(v, offset = 0, constrain = false) {
      let value = (v - this.origin) / this.scale.factor - offset + this.scale.min - this.scale.minPadding;
      if (constrain) value = this.constrainValue(v);
      return value;
   }

   hash() {
      let r = {
         origin: this.origin,
         factor: this.scale.factor,
         min: this.scale.min,
         max: this.scale.max,
         minPadding: this.scale.minPadding,
         maxPadding: this.scale.maxPadding
      };
      r.stacks = Object.keys(this.stacks)
         .map((s) => this.stacks[s].info.join(","))
         .join(":");
      return r;
   }

   isSame(x) {
      let hash = this.hash();
      let same = x && !Object.keys(hash).some((k) => x[k] !== hash[k]);
      this.shouldUpdate = !same;
      return same;
   }

   measure(a, b) {
      this.a = a;
      this.b = b;

      for (let s in this.stacks) {
         let info = this.stacks[s].measure(this.normalized);
         let [min, max, invalid] = info;
         if (this.min == null || min < this.min) this.min = min;
         if (this.max == null || max > this.max) this.max = max;
         this.stacks[s].info = info;
      }

      if (this.minValue != null && this.min == null)
         // || this.minValue < this.min))
         this.min = this.minValue;

      if (this.min == null) this.min = 0;

      if (this.maxValue != null && this.max == null)
         // || this.maxValue > this.max))
         this.max = this.maxValue;

      if (this.max == null) this.max = this.normalized ? 1 : 100;

      if (this.min == this.max) {
         if (this.min == 0) {
            this.min = -1;
            this.max = 1;
         } else {
            let delta = Math.abs(this.min) * 0.1;
            this.min -= delta;
            this.max += delta;
         }
      }

      this.origin = this.inverted ? this.b : this.a;

      this.scale = this.getScale();

      this.calculateTicks();
   }

   getScale(tickSizes) {
      let { min, max } = this;
      let smin = min;
      let smax = max;
      let minPadding = this.minValuePadded != null ? Math.max(0, smin - this.minValuePadded) : 0;
      let maxPadding = this.maxValuePadded != null ? Math.max(0, this.maxValuePadded - smax) : 0;

      let tickSize;
      if (tickSizes && isNumber(this.snapToTicks) && tickSizes.length > 0) {
         tickSize = tickSizes[Math.min(tickSizes.length - 1, this.snapToTicks)];
         smin = Math.floor(smin / tickSize) * tickSize;
         smax = Math.ceil(smax / tickSize) * tickSize;
         minPadding = this.minValuePadded != null ? Math.max(0, smin - this.minValuePadded) : 0;
         maxPadding = this.maxValuePadded != null ? Math.max(0, this.maxValuePadded - smax) : 0;
      }

      let sign = this.b > this.a ? 1 : -1;

      let factor =
         smin < smax
            ? (Math.abs(this.b - this.a) - this.lowerDeadZone - this.upperDeadZone) / (smax - smin + minPadding + maxPadding)
            : 0;

      if (factor < 0) factor = 0;

      if (factor > 0 && (this.lowerDeadZone > 0 || this.upperDeadZone > 0)) {
         while (factor * (min - smin) < this.lowerDeadZone) smin -= this.lowerDeadZone / factor;

         while (factor * (smax - max) < this.upperDeadZone) smax += this.upperDeadZone / factor;

         if (tickSize > 0 && isNumber(this.snapToTicks)) {
            smin = Math.floor(smin / tickSize) * tickSize;
            smax = Math.ceil(smax / tickSize) * tickSize;
            minPadding = this.minValuePadded != null ? Math.max(0, smin - this.minValuePadded) : 0;
            maxPadding = this.maxValuePadded != null ? Math.max(0, this.maxValuePadded - smax) : 0;
         }

         factor = smin < smax ? Math.abs(this.b - this.a) / (smax - smin + minPadding + maxPadding) : 0;
      }

      return {
         factor: sign * (this.inverted ? -factor : factor),
         min: smin,
         max: smax,
         minPadding,
         maxPadding
      };
   }

   acknowledge(value, width = 0, offset = 0) {
      if (value == null) return;

      if (this.minValue == null || value < this.minValue) {
         this.minValue = value;
         this.minValuePadded = value + offset - width / 2;
      }
      if (this.maxValue == null || value > this.maxValue) {
         this.maxValue = value;
         this.maxValuePadded = value + offset + width / 2;
      }
   }

   getStack(name) {
      let s = this.stacks[name];
      if (!s) s = this.stacks[name] = new Stack();
      return s;
   }

   stacknowledge(name, ordinal, value) {
      return this.getStack(name).acknowledge(ordinal, value);
   }

   stack(name, ordinal, value) {
      let v = this.getStack(name).stack(ordinal, value);
      return v != null ? this.map(v) : null;
   }

   findTickSize(minPxDist) {
      return this.tickSizes.find((a) => a >= this.minLabelTickSize && a * Math.abs(this.scale.factor) >= minPxDist);
   }

   getTickSizes() {
      return this.tickSizes;
   }

   calculateTicks() {
      let dist = this.minLabelDistance / Math.abs(this.scale.factor);
      let unit = Math.pow(10, Math.floor(Math.log10(dist)));

      let bestLabelDistance = Infinity;
      let bestTicks = [];
      let bestScale = this.scale;

      for (let i = 0; i < this.tickDivisions.length; i++) {
         let divs = this.tickDivisions[i];
         let tickSizes = divs.filter(ts => ts >= this.minTickStep).map((ts) => ts * unit);
         let scale = this.getScale(tickSizes);
         tickSizes.forEach((size, level) => {
            let labelDistance = size * Math.abs(scale.factor);
            if (labelDistance >= this.minLabelDistance && labelDistance < bestLabelDistance) {
               bestScale = scale;
               bestTicks = tickSizes;
               bestLabelDistance = labelDistance;
            }
         });
      }
      this.scale = bestScale;
      this.tickSizes = bestTicks.filter((ts) => ts >= this.minTickStep && ts * Math.abs(bestScale.factor) >= this.minTickDistance);
      if (this.tickSizes.length > 0) {
         let max = this.tickSizes[this.tickSizes.length - 1];
         this.tickSizes.push(2 * max);
         this.tickSizes.push(5 * max);
         this.tickSizes.push(10 * max);
         let min = this.tickSizes[0];
         let dist = min * Math.abs(bestScale.factor) >= this.minTickDistance;
         if (min / 10 >= this.minTickStep && dist / 10 >= this.minTickDistance)
            this.tickSizes.splice(0, 0, min / 10);
         else if (min / 5 >= this.minTickStep && dist / 5 >= this.minTickDistance)
            this.tickSizes.splice(0, 0, min / 5);
         else if (min / 2 >= this.minTickStep && dist / 2 >= this.minTickDistance)
            this.tickSizes.splice(0, 0, min / 2);
      }
   }

   getTicks(tickSizes) {
      return tickSizes.map((size) => {
         let start = Math.ceil((this.scale.min - this.scale.minPadding) / size);
         let end = Math.floor((this.scale.max + this.scale.maxPadding) / size);
         let result = [];
         for (let i = start; i <= end; i++) result.push(i * size + 0);
         return result;
      });
   }

   mapGridlines() {
      let size = this.tickSizes[0];
      let start = Math.ceil((this.scale.min - this.scale.minPadding) / size);
      let end = Math.floor((this.scale.max + this.scale.maxPadding) / size);
      let result = [];
      for (let i = start; i <= end; i++) result.push(this.map(i * size));
      return result;
   }
}
