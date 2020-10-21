import { HtmlElement } from 'cx/widgets';
import { Controller } from 'cx/ui';
import { updateArray } from 'cx/data';
import {Md} from '../components/Md'
import {SideNav} from 'docs/components/SideNav';

//Deprecated, see ./layout/DocsNav

var contents = [{
    topic: 'Introduction',
    expanded: false,
    articles: [
        {title: 'Welcome', url: '~/intro/welcome'},
        {title: 'Getting Started', url: '~/intro/getting-started'},
        {title: 'JSX', url: '~/intro/jsx'},
        {title: 'CLI', url: '~/intro/command-line'},
        {title: 'NPM Packages', url: '~/intro/npm-packages'},
        {title: 'Breaking Changes', url: '~/intro/breaking-changes'},
        {title: 'Step by Step Tutorial', url: '~/intro/step-by-step'},
        {title: 'Feature List', url: '~/intro/feature-list'},
    ]
}, {
    topic: 'Concepts',
    expanded: false,
    articles: [
        {title: 'Store', url: '~/concepts/store'},
        {title: 'Widgets', url: '~/concepts/widgets'},
        {title: 'Data Binding', url: '~/concepts/data-binding'},
        {title: 'Data Views', url: '~/concepts/data-views'},
        {title: 'Private Store', url: '~/concepts/private-stores'},
        {title: 'Controllers', url: '~/concepts/controllers'},
        {title: 'Inner Layouts', url: '~/concepts/inner-layouts'},
        {title: 'Functional Components', url: '~/concepts/functional-components'},
        {title: 'Outer Layouts', url: '~/concepts/outer-layouts'},
        {title: 'Router', url: '~/concepts/router'},
        {title: 'Selection', url: '~/concepts/selections'},
        {title: 'CSS', url: '~/concepts/css'},
        {title: 'Formatting', url: '~/concepts/formatting'},
        {title: 'Localization', url: '~/concepts/localization'},
        {title: 'Charts', url: '~/concepts/charts'},
        {title: 'Drag & Drop', url: '~/concepts/drag-and-drop'},
    ]
}, {
    topic: 'Forms and Grids',
    expanded: false,
    articles: [
        {title: 'TextField', url: '~/widgets/text-fields'},
        {title: 'NumberField', url: '~/widgets/number-fields'},
        {title: 'Checkbox', url: '~/widgets/checkboxes'},
        {title: 'Radio', url: '~/widgets/radios'},
        {title: 'DateField', url: '~/widgets/date-fields'},
        {title: 'DateTimeField', url: '~/widgets/date-time-fields'},
        {title: 'Calendar', url: '~/widgets/calendars'},
        {title: 'MonthPicker', url: '~/widgets/month-pickers'},
        {title: 'MonthField', url: '~/widgets/month-fields'},
        {title: 'TextArea', url: '~/widgets/text-areas'},
        {title: 'Select', url: '~/widgets/select-fields'},
        {title: 'LookupField', url: '~/widgets/lookup-fields'},
        {title: 'List', url: '~/widgets/lists'},
        {title: 'ColorField', url: '~/widgets/color-fields'},
        {title: 'ColorPicker', url: '~/widgets/color-pickers'},
        {title: 'Slider', url: '~/widgets/sliders'},
        {title: 'Label', url: '~/widgets/labels'},
        {title: 'ValidationGroup', url: '~/widgets/validation-groups'},
        {title: 'Validator', url: '~/widgets/validators'},
        {title: 'FieldGroup', url: '~/widgets/field-groups'},
        {title: 'LabeledContainer', url: '~/widgets/labeled-containers'},
        {title: 'Switch', url: '~/widgets/switches'},
        {title: 'Grid', url: '~/widgets/grids'}
    ]
}, {
    topic: 'Navigation',
    expanded: false,
    articles: [
        {title: 'Menu', url: '~/widgets/menus'},
        {title: 'Tab', url: '~/widgets/tabs'},
        {title: 'HScroller', url: '~/widgets/hscrollers'},
        {title: 'Link', url: '~/widgets/links'},
        {title: 'LinkButton', url: '~/widgets/link-buttons'},
    ]
}, {
    topic: 'General Purpose Widgets',
    expanded: false,
    articles: [
        {title: 'HtmlElement', url: '~/widgets/html-elements'},
        {title: 'Button', url: '~/widgets/buttons'},
        {title: 'UploadButton', url: '~/widgets/upload-button'},
        {title: 'Section', url: '~/widgets/sections'},
        {title: 'Heading', url: '~/widgets/headings'},
        {title: 'FlexBox', url: '~/widgets/flex-box'},
        {title: 'Resizer', url: '~/widgets/resizers'},
        {title: 'Icon', url: '~/widgets/icons'},
        {title: 'PureContainer', url: '~/widgets/pure-container'},
        {title: 'IsolatedScope', url: '~/widgets/isolated-scope'},
        {title: 'DetachedScope', url: '~/widgets/detached-scope'},
        {title: 'ContentResolver', url: '~/widgets/content-resolvers'},
        {title: 'ProgressBar', url: '~/widgets/progress-bars'},
        {title: 'Text', url: '~/widgets/texts'},
    ]
}, {
    topic: 'Overlays',
    expanded: false,
    articles: [
        {title: 'Overlays', url: '~/widgets/overlays'},
        {title: 'Windows', url: '~/widgets/windows'},
        {title: 'MsgBox', url: '~/widgets/msg-boxes'},
        {title: 'Toast', url: '~/widgets/toasts'},
        {title: 'Tooltips', url: '~/widgets/tooltips'},
        {title: 'Flyweight Tooltips', url: '~/widgets/flyweight-tooltip-tracker'},
        {title: 'ContextMenu', url: '~/widgets/context-menus'},
    ]
}, {
    topic: 'Svg',
    expanded: false,
    articles: [
        {title: 'Svg', url: '~/svg/svgs'},
        {title: 'Text', url: '~/svg/texts'},
        {title: 'Rectangle', url: '~/svg/rectangles'},
        {title: 'Ellipse', url: '~/svg/ellipses'},
        {title: 'Line', url: '~/svg/lines'},
        {title: 'ClipRect', url: '~/svg/clip-rects'},
    ]
}, {
    topic: 'Charts',
    expanded: false,
    articles: [
        {title: 'Chart', url: '~/charts/charts'},
        {title: 'PieChart', url: '~/charts/pie-charts'},
        {title: 'LineGraph', url: '~/charts/line-graphs'},
        {title: 'ColumnGraph', url: '~/charts/column-graphs'},
        {title: 'BarGraph', url: '~/charts/bar-graphs'},
        {title: 'ScatterGraph', url: '~/charts/scatter-graphs'},
        {title: 'Column', url: '~/charts/columns'},
        {title: 'Bar', url: '~/charts/bars'},
        {title: 'Marker', url: '~/charts/markers'},
        {title: 'MarkerLine', url: '~/charts/marker-lines'},
        {title: 'Range', url: '~/charts/ranges'},
        {title: 'NumericAxis', url: '~/charts/numeric-axis'},
        {title: 'CategoryAxis', url: '~/charts/category-axis'},
        {title: 'TimeAxis', url: '~/charts/time-axis'},
        {title: 'ColorMap', url: '~/charts/color-map'},
        {title: 'Legend', url: '~/charts/legend'},
        {title: 'Gridlines', url: '~/charts/gridlines'},
        {title: 'MouseTracker', url: '~/charts/mouse-tracker'},
        {title: 'PointReducer', url: '~/charts/point-reducers'},
        {title: 'ValueAtFinder', url: '~/charts/value-at-finder'},
        {title: 'SnapPointFinder', url: '~/charts/snap-point-finder'},
        {title: 'MinMaxFinder', url: '~/charts/min-max-finder'},
    ]
}, {
    topic: 'Util',
    expanded: false,
    articles: [
        {title: 'Color', url: '~/util/color'},
        {title: 'Date', url: '~/util/date'},
        {title: 'DOM', url: '~/util/dom'},
        {title: 'Misc', url: '~/util/misc'},
    ]
}, {
    topic: 'Meta',
    expanded: false,
    articles: [
        {title: 'Versioning', url: '~/meta/versioning'},
        {title: 'CxCredit Widget', url: '~/meta/cx-credit'},
        {title: 'Open Source', url: '~/meta/open-source-software'},
    ]
}];


class CController extends Controller {
    init() {
        super.init();
        this.store.init('contents', contents);

        this.addTrigger('active-topic-expand', ['url'], (url) => {
            this.store.update('contents', updateArray, t => ({
                ...t,
                expanded: true
            }), t=>!t.expanded && t.articles.some(x=>url.indexOf(x.url) == 0))
        }, true);
    }
}

export const Contents = <cx>
    <div class="dxb-contents" controller={CController}>
        <SideNav records-bind="contents" />
    </div>
</cx>;
