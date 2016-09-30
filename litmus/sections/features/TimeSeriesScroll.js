import {HtmlElement} from 'cx/ui/HtmlElement';
import {Controller} from 'cx/ui/Controller';
import {Svg} from 'cx/ui/svg/Svg';
import {Chart} from 'cx/ui/svg/charts/Chart';
import {TimeAxis} from 'cx/ui/svg/charts/axis/TimeAxis';
import {NumericAxis} from 'cx/ui/svg/charts/axis/NumericAxis';
import {Rectangle} from 'cx/ui/svg/Rectangle';
import {ClipRect} from 'cx/ui/svg/ClipRect';
import {Range} from 'cx/ui/svg/charts/Range';
import {Marker} from 'cx/ui/svg/charts/Marker';
import {Gridlines} from 'cx/ui/svg/charts/Gridlines';
import {ColumnGraph} from 'cx/ui/svg/charts/ColumnGraph';
import {TextField} from 'cx/ui/form/TextField';

class PageController extends Controller {
   init() {
      super.init();

      this.store.init('$page.range', {
         from:  new Date(2011, 0, 1),
         to:  new Date(2012, 0, 1),
      });

      var v = 1000;

      this.store.set('$page.data', Array.from({length: 20 * 12}, (x, i)=>({
         date: new Date(1995, i, 1),
         value: v = (v + Math.random() * 300 - 150)
      })));
   }
}

export default <cx>
   <div class="widgets" controller={PageController}>
      <Svg style="width:100%;height:600px;" margin="60 60 60 60">
         <Chart
            anchors="0 1 0.8 0"
            offset="0 0 -50 0"
            axes={{
            x: <TimeAxis min:bind="$page.range.from" max:bind="$page.range.to" snapToTicks={false} />,
            y: <NumericAxis vertical />,
         }}>
            <Rectangle fill="white"/>
            <Gridlines />
            <ClipRect>
               <ColumnGraph data:bind="$page.data"
                            colorIndex={4}
                            size={30 * 24 * 60 * 60 * 1000}
                            offset={15 * 24 * 60 * 60 * 1000}
                            xField="date"
                            yField="value" />
            </ClipRect>
         </Chart>

         <Chart
            anchors="0.8 1 1 0"
            axes={{
               x: <TimeAxis />,
               y: <NumericAxis vertical />,
            }}>
            <Rectangle fill="white"/>
            <Gridlines />
            <ColumnGraph
               data:bind="$page.data"
               size={30 * 24 * 60 * 60 * 1000}
               offset={15 * 24 * 60 * 60 * 1000}
               xField="date"
               yField="value"
            />

            <Range
               colorIndex={4}
               x1:bind="$page.range.from"
               x2:bind="$page.range.to"
            >
               <ClipRect>
                  <ColumnGraph
                     data:bind="$page.data"
                     colorIndex={4}
                     size={30 * 24 * 60 * 60 * 1000}
                     offset={15 * 24 * 60 * 60 * 1000}
                     xField="date"
                     yField="value"
                  />
               </ClipRect>
            </Range>

            <Marker
               colorIndex={4}
               x:bind="$page.range.from"
               size={10}
               draggableX
               constrain
            />

            <Marker
               colorIndex={4}
               x:bind="$page.range.to"
               size={10}
               draggableX
               constrain
            />

            />
         </Chart>
      </Svg>
      <TextField value:bind="$page.x" />
   </div>
</cx>;