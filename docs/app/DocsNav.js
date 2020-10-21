import { Controller } from "cx/ui";
import { SideNav } from "../components/SideNav";
import { updateArray } from "cx/data";

export const docsNavTree = [
    {
        url: "~/intro",
        text: "Intro",
        children: [
            {
                text: "Overview",
                children: [
                    { text: "Welcome", url: "~/intro/welcome" },
                    { text: "Getting Started", url: "~/intro/getting-started" },
                ],
            },
            {
                text: "Pre-requsites",
                children: [
                    { text: "JSX", url: "~/intro/jsx" },
                    { text: "CLI", url: "~/intro/command-line" },
                    { text: "NPM Packages", url: "~/intro/npm-packages" },
                    {
                        text: "Breaking Changes",
                        url: "~/intro/breaking-changes",
                    },
                    {
                        text: "Step by Step Tutorial",
                        url: "~/intro/step-by-step",
                    },
                    { text: "Feature List", url: "~/intro/feature-list" },
                ],
            },
        ],
    },
    {
        url: "~/concepts",
        text: "Concepts",
        children: [
            {
                text: "Basic",
                children: [
                    { text: "Store", url: "~/concepts/store" },
                    { text: "Widgets", url: "~/concepts/widgets" },
                    { text: "Data Binding", url: "~/concepts/data-binding" },
                    { text: "Data Views", url: "~/concepts/data-views" },
                    { text: "Controllers", url: "~/concepts/controllers" },
                    { text: "Inner Layouts", url: "~/concepts/inner-layouts" },
                    { text: "CSS", url: "~/concepts/css" },
                    { text: "Formatting", url: "~/concepts/formatting" },
                    { text: "Selection", url: "~/concepts/selections" },
                ],
            },
            {
                text: "Advanced",
                children: [
                    { text: "Router", url: "~/concepts/router" },
                    { text: "Outer Layouts", url: "~/concepts/outer-layouts" },
                    {
                        text: "Functional Components",
                        url: "~/concepts/functional-components",
                    },
                    { text: "Private Store", url: "~/concepts/private-stores" },
                    { text: "Localization", url: "~/concepts/localization" },
                    { text: "Charts", url: "~/concepts/charts" },
                    { text: "Drag & Drop", url: "~/concepts/drag-and-drop" },
                ],
            },
        ],
    },
    {
        url: "~/widgets",
        text: "Widgets",
        children: [
            {
                text: "General Purpose",
                children: [
                    { text: "Button", url: "~/widgets/buttons" },
                    { text: "UploadButton", url: "~/widgets/upload-button" },
                    { text: "Section", url: "~/widgets/sections" },
                    { text: "Heading", url: "~/widgets/headings" },
                    { text: "FlexBox", url: "~/widgets/flex-box" },
                    { text: "Resizer", url: "~/widgets/resizers" },
                    { text: "Icon", url: "~/widgets/icons" },

                    { text: "ProgressBar", url: "~/widgets/progress-bars" },
                    { text: "Text", url: "~/widgets/texts" },
                ],
            },
            {
                text: "Collections",
                children: [
                    { text: "Grid", url: "~/widgets/grids" },
                    { text: "Tree Grid", url: "~/widgets/tree-grid" },
                    { text: "List", url: "~/widgets/lists" },
                ],
            },
            {
                text: "Form",
                children: [
                    { text: "TextField", url: "~/widgets/text-fields" },
                    { text: "NumberField", url: "~/widgets/number-fields" },
                    { text: "DateField", url: "~/widgets/date-fields" },
                    { text: "LookupField", url: "~/widgets/lookup-fields" },
                    { text: "Checkbox", url: "~/widgets/checkboxes" },
                    { text: "Radio", url: "~/widgets/radios" },
                    { text: "Select", url: "~/widgets/select-fields" },
                    { text: "TextArea", url: "~/widgets/text-areas" },
                    {
                        text: "DateTimeField",
                        url: "~/widgets/date-time-fields",
                    },
                    { text: "Calendar", url: "~/widgets/calendars" },
                    { text: "MonthField", url: "~/widgets/month-fields" },
                    { text: "MonthPicker", url: "~/widgets/month-pickers" },
                    { text: "ColorField", url: "~/widgets/color-fields" },
                    { text: "ColorPicker", url: "~/widgets/color-pickers" },
                    { text: "Sliders", url: "~/widgets/sliders" },
                    { text: "Switches", url: "~/widgets/switches" },
                    { text: "Labels", url: "~/widgets/labels" },
                    {
                        text: "LabeledContainer",
                        url: "~/widgets/labeled-containers",
                    },
                    { text: "FieldGroup", url: "~/widgets/field-groups" },
                    { text: "Validator", url: "~/widgets/validators" },
                    {
                        text: "ValidationGroup",
                        url: "~/widgets/validation-groups",
                    },
                ],
            },
            {
                text: "Navigation",
                children: [
                    { text: "Menu", url: "~/widgets/menus" },
                    { text: "Tab", url: "~/widgets/tabs" },
                    { text: "HScroller", url: "~/widgets/hscrollers" },
                    { text: "Link", url: "~/widgets/links" },
                    { text: "LinkButton", url: "~/widgets/link-buttons" },
                ],
            },
            {
                text: "Containers",
                children: [
                    { text: "PureContainer", url: "~/widgets/pure-container" },
                    { text: "HtmlElement", url: "~/widgets/html-elements" },
                    {
                        text: "ContentResolver",
                        url: "~/widgets/content-resolvers",
                    },
                    { text: "IsolatedScope", url: "~/widgets/isolated-scope" },
                    { text: "DetachedScope", url: "~/widgets/detached-scope" },
                ],
            },
            {
                text: "Overlays",
                children: [
                    { text: "Overlays", url: "~/widgets/overlays" },
                    { text: "Windows", url: "~/widgets/windows" },
                    { text: "MsgBox", url: "~/widgets/msg-boxes" },
                    { text: "Toast", url: "~/widgets/toasts" },
                    { text: "Tooltips", url: "~/widgets/tooltips" },
                    { text: "Flyweight Tooltips", url: "~/widgets/flyweight-tooltip-tracker" },
                    { text: "ContextMenu", url: "~/widgets/context-menus" },
                ],
            },
        ],
    },
    {
        url: "~/charts",
        alternativeUrls: ["~/svg"],
        text: "Charts",
        children: [
            {
                text: "SVG",
                children: [
                    { text: 'Svg', url: '~/svg/svgs' },
                    { text: 'Text', url: '~/svg/texts' },
                    { text: 'Rectangle', url: '~/svg/rectangles' },
                    { text: 'Ellipse', url: '~/svg/ellipses' },
                    { text: 'Line', url: '~/svg/lines' },
                    { text: 'ClipRect', url: '~/svg/clip-rects' },
                ],
            },
            {
                text: "Charts",
                children: [
                    { text: "General", url: "~/charts/charts" },
                    { text: "PieChart", url: "~/charts/pie-charts" },
                    { text: "LineGraph", url: "~/charts/line-graphs" },
                    { text: "ColumnGraph", url: "~/charts/column-graphs" },
                    { text: "BarGraph", url: "~/charts/bar-graphs" },
                    { text: "ScatterGraph", url: "~/charts/scatter-graphs" },
                    { text: "Column", url: "~/charts/columns" },
                    { text: "Bar", url: "~/charts/bars" },
                    { text: "MarkerLine", url: "~/charts/marker-lines" },
                    { text: "Range", url: "~/charts/ranges" },
                ],
            },
            {
                text: "Misc",
                children: [
                    { text: "NumericAxis", url: "~/charts/numeric-axis" },
                    { text: "CategoryAxis", url: "~/charts/category-axis" },
                    { text: "TimeAxis", url: "~/charts/time-axis" },
                    { text: "ColorMap", url: "~/charts/color-map" },
                    { text: "Legend", url: "~/charts/legend" },
                    { text: "Gridlines", url: "~/charts/gridlines" },
                    { text: "MouseTracker", url: "~/charts/mouse-tracker" },
                    { text: "PointReducer", url: "~/charts/point-reducers" },
                    { text: "ValueAtFinder", url: "~/charts/value-at-finder" },
                    {
                        text: "SnapPointFinder",
                        url: "~/charts/snap-point-finder",
                    },
                    { text: "MinMaxFinder", url: "~/charts/min-max-finder" },
                    { text: "HoverSync", url: "~/charts/hover-sync" },
                ],
            },
        ],
    },
    {
        url: "~/examples",
        text: "Examples",
        children: [
            {
                text: "Form",
                children: [
                    {
                        text: "Validation Options",
                        url: "~/examples/form/validation-options",
                    },
                ],
            },
            {
                text: "List",
                children: [
                    {
                        text: "Grouping",
                        url: "~/examples/list/grouping",
                    },
                ],
            },
            {
                text: "Grid",
                children: [
                    { text: "Pagination", url: "~/examples/grid/pagination" },
                    {
                        text: "Multiple Selection",
                        url: "~/examples/grid/multiple-selection",
                    },
                    { text: "Grouping", url: "~/examples/grid/grouping" },
                    {
                        text: "Dynamic Grouping",
                        url: "~/examples/grid/dynamic-grouping",
                    },
                    {
                        text: "Column Resizing",
                        url: "~/examples/grid/column-resizing",
                    },
                    {
                        text: "Fixed Columns",
                        url: "~/examples/grid/fixed-columns",
                    },
                    {
                        text: "Complex Headers",
                        url: "~/examples/grid/complex-headers",
                    },
                    {
                        text: "Header Menu",
                        url: "~/examples/grid/header-menu",
                    },
                    {
                        text: "Form Editing",
                        url: "~/examples/grid/form-edit",
                    },
                    {
                        text: "Inline Editing",
                        url: "~/examples/grid/inline-edit",
                    },
                    {
                        text: "Cell Editing",
                        url: "~/examples/grid/cell-editing",
                    },
                    {
                        text: "Row Editing",
                        url: "~/examples/grid/row-editing",
                    },
                    {
                        text: "Row Expanding",
                        url: "~/examples/grid/row-expanding",
                    },
                    {
                        text: "Buffering",
                        url: "~/examples/grid/buffering",
                    },
                    {
                        text: "Infinite Scrolling",
                        url: "~/examples/grid/infinite-scrolling",
                    },
                ],
            },
            {
                text: "Charts",
                children: [
                    {
                        text: "Stacked Line Chart",
                        url: "~/examples/charts/line/stacked",
                    },
                    {
                        text: "Bullet Chart",
                        url: "~/examples/charts/bar/bullets",
                    },
                    {
                        text: "Multi-level Pie Chart",
                        url: "~/examples/charts/pie/multi-level",
                    },
                    {
                        text: "Bars + Grid Selection",
                        url: "~/examples/charts/bar/combination",
                    },
                    {
                        text: "Stacked Bars",
                        url: "~/examples/charts/bar/stacked",
                    },
                    {
                        text: "Timeline",
                        url: "~/examples/charts/bar/timeline",
                    },
                    {
                        text: "Column + Grid Selection",
                        url: "~/examples/charts/column/combination",
                    },
                    {
                        text: "Normalized Columns",
                        url: "~/examples/charts/column/normalized",
                    },
                    {
                        text: "Stacked Columns",
                        url: "~/examples/charts/column/stacked",
                    },
                    {
                        text: "Auto-sized Columns",
                        url: "~/examples/charts/column/auto-width",
                    },
                ],
            },
        ],
    },
];

// class CController extends Controller {
//     init() {
//         super.init();
//         this.store.init('docsNavTree', docsNavTree);

//         this.addTrigger('active-text-expand', ['url'], (url) => {
//             this.store.update('docsNavTree', updateArray, t => ({
//                 ...t,
//                 expanded: true
//             }), t=>!t.expanded && t.children.some(x=>url.indexOf(x.url) == 0))
//         }, true);
//     }
// };

// export const DocsNav = <cx>
//     <div class="dxb-contents" controller={CController}>
//         <SideNav records-bind="docsNavTree"/>
//     </div>
// </cx>;
