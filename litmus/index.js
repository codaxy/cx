import { Widget, startAppLoop, History, startHotAppLoop } from "cx/ui";
//import { HtmlElement } from 'cx/widgets';
import { Timing, Debug } from "cx/util";
import { Store } from "cx/data";
import "./error";

import "./index.scss";

// import {GridSection as Demo} from './sections/Grid';
// import {FormSection as Demo} from './sections/Form';
// import {WindowSection as Demo} from './sections/Window';
// import {ListSection as Demo} from './sections/List';
// import Demo from './sections/ComplexGrid';
// import Demo from './sections/features/TimeSeriesScroll';
// import {MixedModeForm as Demo} from './components/MixedModeForm';
//import Demo from './performance/LongList';

//import Demo from './features/flexbox';
//import Demo from './features/drag-drop/ReorderInsertionLine';
//import Demo from './features/drag-drop/Dashboard';
//import Demo from './features/drag-drop/trello';
// import Demo from './features/drag-drop/tree-grid-to-tree-grid';
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
//import Demo from "./features/grid/header-tool";
//import Demo from "./features/grid/GridBuffering";
//import Demo from './features/grid/RowEditing';
//import Demo from './features/grid/MultiLine';
//import Demo from './features/grid/FixedFooterNoGrouping';
//import Demo from "./features/grid/CellEditing";
//import Demo from './features/hscroll';
//import Demo from './features/grid/InfiniteScroll';
//import Demo from './features/list/GroupingAndSelection';
//import Demo from './features/restate/LookupField';
//import Demo from './features/restate/ErrorMessage';
//import Demo from './features/restate/PersistentRestate';
//import Demo from './features/layout/MultiColumnLabelsTopLayout';

//import Demo from './features/menu/icons';
//import Demo from "./features/menu/overflow";
//import Demo from './features/window/header-buttons';
//import Demo from './features/window/persist-position';

//import Demo from './features/fun-comps/ts';
//import Demo from './features/fun-comps/js';

//import Demo from './features/layout/OuterLayout';
//import Demo from './features/layout/ComplexLayout';
//import Demo from './features/resizer';

//import Demo from './bugs/stacked';
//import Demo from './bugs/FirstVisibleChild';
//import Demo from './bugs/LabelsTopLayout';

//import Demo from './bugs/509';
//import Demo from './features/typescript/jsx';
//import Demo from "./bugs/530";
//import Demo from "./features/restate/DeferredUpdates";
//import Demo from "./features/layout/ComplexLabelsTopLayout";
//import Demo from "./features/grid/GroupingCaptions";
//import Demo from "./bugs/519";
//import Demo from "./features/restate/DeferredUpdates";
//import Demo from "./features/hooks/Clock";
//import Demo from "./features/hooks/complex";
//import Demo from "./features/hooks/localStorage";
//import Demo from "./bugs/Spread";
//import Demo from "./bugs/587";
//import Demo from "./bugs/MultipleSelection";
//import Demo from "./bugs/tree-sorting";
//import Demo from "./bugs/leak";
import Demo from "./bugs/697";
//import Demo from "./bugs/674";
//import Demo from "./features/grid/DockedColumns";
//import Demo from "./features/time-list";
//import Demo from "./features/debounce/NumberField";
//import Demo from "./bugs/656";
//import Demo from "./bugs/RestateFirstVisibleChild";

let store = (window.store = new Store());

Widget.resetCounter();
//Widget.optimizePrepare = false;
//Widget.prototype.memoize = false;
//Timing.enable('vdom-render');
Timing.enable("app-loop");
Debug.enable("app-data");

History.connect(store, "url");

let stop = startHotAppLoop(module, document.getElementById("app"), store, Demo);
