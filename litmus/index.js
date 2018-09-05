import { Widget, startAppLoop, History } from 'cx/ui';
//import { HtmlElement } from 'cx/widgets';
import { Timing, Debug } from 'cx/util';
import { Store } from 'cx/data';
import "./error";


import './index.scss';

// import {GridSection as Demo} from './sections/Grid';
// import {FormSection as Demo} from './sections/Form';
// import {WindowSection as Demo} from './sections/Window';
// import {ListSection as Demo} from './sections/List';
// import Demo from './sections/ComplexGrid';
// import Demo from './sections/features/TimeSeriesScroll';
// import {MixedModeForm as Demo} from './components/MixedModeForm';
//import Demo from './performance/LongList';
//
//
//import Demo from './bugs/236';
//import Demo from './bugs/282';
// import Demo from './bugs/192';
// import Demo from './bugs/search';
//import Demo from './bugs/395';
//import Demo from './bugs/414';
//import Demo from './bugs/NativeCheckboxesAndRadios';
//import Demo from './bugs/Repeater';
//import Demo from './bugs/179';
//import Demo from './bugs/380';
//import Demo from './bugs/JSXSpread';
//import Demo from './bugs/MultiModals';
//import Demo from './bugs/lookupfiledset';
//import Demo from './bugs/469';
//import Demo from "./bugs/GridFilters";

//import Demo from './features/flexbox';
//import Demo from './features/drag-drop/ReorderInsertionLine';
//import Demo from './features/drag-drop/Dashboard';
//import Demo from './features/drag-drop/trello';
//import Demo from './features/drag-drop/grid-to-grid';
//import Demo from './features/drag-drop/ReorderHorizontal';
//import Demo from './features/drag-drop/Boxes';
//import Demo from './features/wheel';
//import Demo from './features/logo';
//import Demo from './features/svg/rects';
//import Demo from './features/destroy';
//import Demo from './features/tracking';
//import Demo from './features/caching/IsolatedBoxes';
//import Demo from './features/context-menu';
//import Demo from './features/charts/time-axis/LocalTime';

//import Demo from './features/grid/header-tool';
//import Demo from './features/grid/GridBuffering';
//import Demo from './features/grid/RowEditing';
//import Demo from './features/grid/MultiLine';
//import Demo from './features/grid/FixedFooterNoGrouping';
//import Demo from './features/hscroll';
//import Demo from './features/grid/InfiniteScroll';
//import Demo from './features/list/GroupingAndSelection';
//import Demo from './features/restate/LookupField';
//import Demo from './features/layout/MultiColumnLabelsTopLayout';

//import Demo from './features/menu/icons';
//import Demo from './features/window/header-buttons';
//import Demo from './features/window/persist-position';

//import Demo from './features/fun-comps/ts';
//import Demo from './features/fun-comps/js';

//import Demo from './features/layout/OuterLayout';
//import Demo from './features/layout/ComplexLayout';
import Demo from './features/resizer';

//import Demo from './bugs/stacked';

let store = new Store();

Widget.resetCounter();
//Widget.optimizePrepare = false;
//Widget.prototype.memoize = false;
//Timing.enable('vdom-render');
//Timing.enable('app-loop');
//Debug.enable("app-data");

History.connect(store, "url");


if (module.hot) {

   // accept itself
   module.hot.accept();

   // remember data on dispose
   module.hot.dispose(function (data) {
      data.state = store.getData();
      if (stop)
         stop();
   });

   //apply data on hot replace
   if (module.hot.data)
      store.load(module.hot.data.state);
}

let stop = startAppLoop(document.getElementById('app'), store, <cx>
   <div>
      <Demo />
   </div>
</cx>);

