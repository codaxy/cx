import {Widget, VDOM, getContent} from '../../ui/Widget';
import {exploreChildren} from '../../ui/layout/exploreChildren';
import {PureContainer} from '../../ui/PureContainer';
import {HtmlElement} from '../HtmlElement';
import {Binding} from '../../data/Binding';
import {getSelector} from '../../data/getSelector';
import {isSelector} from '../../data/isSelector';
import {Format} from '../../ui/Format';
import {Selection} from '../../ui/selection/Selection';
import {DataAdapter} from '../../ui/adapter/DataAdapter';
import {GroupAdapter} from '../../ui/adapter/GroupAdapter';
import {ResizeManager} from '../../ui/ResizeManager';
import {KeyCode} from '../../util/KeyCode';
import {scrollElementIntoView} from '../../util/scrollElementIntoView';
import {findScrollableParent} from '../../util/findScrollableParent'
import {FocusManager, oneFocusOut, offFocusOut} from '../../ui/FocusManager';
import DropDownIcon from '../icons/sort-asc';
import {
   initiateDragDrop,
   registerDropZone,
} from '../drag-drop/ops';

import {GridCell} from './GridCell';
import {GridRow, GridRowComponent} from './GridRow';
import {Localization} from '../../ui/Localization';
import {SubscriberList} from '../../util/SubscriberList';
import {RenderingContext} from '../../ui/RenderingContext';
import {isNonEmptyArray} from '../../util/isNonEmptyArray';
import {isString} from '../../util/isString';
import {isDefined} from '../../util/isDefined';
import {isArray} from '../../util/isArray';
import {isNumber} from '../../util/isNumber';
import {debounce} from '../../util/debounce';

export class Grid extends Widget {

   declareData() {

      let selection = this.selection.configureWidget(this);

      super.declareData({
         records: undefined,
         class: {structured: true},
         className: {structured: true},
         style: {structured: true},
         sorters: undefined,
         scrollable: undefined,
         sortField: undefined,
         sortDirection: undefined,
         emptyText: undefined,
         dragSource: {structured: true},
         dropZone: {structured: true},
         filterParams: {structured: true},
         offset: undefined,
         totalRecordCount: undefined,
      }, selection, ...arguments);
   }

   init() {

      if (this.bufferedLoading) {
         this.buffered = true;
         this.remoteSort = true;
      }

      if (this.buffered)
         this.scrollable = true;

      if (this.records && this.records.bind)
         this.recordsBinding = Binding.get(this.records.bind);

      let columns = this.columns;

      this.columns = Widget.create(GridColumnHeader, this.columns || []);
      this.columns.forEach(c => c.init());

      let aggregates = {};
      this.columns.filter(c => c.aggregate && c.aggregateField).forEach(c => {
         aggregates[c.aggregateField] = {
            value: c.value != null ? c.value : {bind: this.recordName + '.' + c.field},
            weight: c.weight != null ? c.weight : c.weightField && {bind: this.recordName + '.' + c.weightField},
            type: c.aggregate
         }
      });

      //add default footer if some columns have aggregates and grouping is not defined
      if (!this.grouping && Object.keys(aggregates).length > 0)
         this.grouping = [{
            key: {},
            showFooter: true
         }];

      this.dataAdapter = DataAdapter.create({
         type: (this.dataAdapter && this.dataAdapter.type) || GroupAdapter,
         recordsBinding: this.recordsBinding,
         keyField: this.keyField,
         aggregates: aggregates,
         recordName: this.recordName
      }, this.dataAdapter);

      this.selection = Selection.create(this.selection, {
         records: this.records
      });

      if (!this.selection.isDummy)
         this.selectable = true;

      super.init();

      this.row = Widget.create(GridRow, {
         class: this.CSS.element(this.baseClass, 'data'),
         className: this.rowClass,
         style: this.rowStyle,
         items: Widget.create(GridCell, columns || [], {
            recordName: this.recordName
         })
      });

      if (this.grouping) {
         this.groupBy(this.grouping)
      }
   }

   initState(context, instance) {
      instance.state = {};
   }

   prepareData(context, instance) {

      let {data, state} = instance;

      if (!isArray(data.records))
         data.records = [];

      if (!this.bufferedLoading)
         data.totalRecordCount = data.records.length;
      else {
         if (!(data.totalRecordCount >= 0))
            data.totalRecordCount = 0;
         if (!isNumber(data.offset) || data.offset < 0)
            data.offset = 0;
      }

      if (state.sorters && !data.sorters)
         data.sorters = state.sorters;

      if (data.sortField && data.sortDirection)
         data.sorters = [{
            field: data.sortField,
            direction: data.sortDirection
         }];

      if ((!data.sorters || data.sorters.length == 0) && this.defaultSortField)
         data.sorters = [{
            field: this.defaultSortField,
            direction: this.defaultSortDirection || 'ASC'
         }];

      let headerMode = this.headerMode;

      if (this.headerMode == null) {
         if (this.scrollable || this.columns.some(x => x.sortable))
            headerMode = "default";
         else
            headerMode = 'plain';
      }

      let border = this.border;

      if (this.showBorder || (border == null && this.scrollable))
         border = true;

      let dragMode = false;
      if (data.dragSource)
         dragMode = data.dragSource.mode || 'move';

      let dropMode = data.dropZone && data.dropZone.mode;

      if (this.onDrop && !dropMode)
         dropMode = 'preview';

      data.dropMode = dropMode;

      data.stateMods = {
         selectable: this.selectable,
         scrollable: data.scrollable,
         buffered: this.buffered,
         ['header-' + headerMode]: true,
         border: border,
         vlines: this.vlines,
         ['drag-' + dragMode]: dragMode,
         ['drop-' + dropMode]: dropMode
      };

      super.prepareData(context, instance);

      instance.records = this.mapRecords(context, instance);
   }

   initInstance(context, instance) {
      instance.refs = {
         header: {},
         fixed: {}
      };

      instance.fixedHeaderResizeEvent = new SubscriberList();

      super.initInstance(context, instance);
   }

   explore(context, instance) {

      let parentPositionChangeEvent = context.parentPositionChangeEvent;
      context.parentPositionChangeEvent = instance.fixedHeaderResizeEvent;
      super.explore(context, instance);

      let columns = exploreChildren(context, instance, this.columns, instance.columns);
      if (columns != instance.columns) {
         instance.columns = columns;
         instance.shouldUpdate = true;
      }

      let {store} = instance;
      instance.isSelected = this.selection.getIsSelectedDelegate(store);

      //do not process rows in buffered mode or cached mode if nothing has changed;
      if (!this.buffered && (!this.cached || instance.shouldUpdate)) {
         let dragHandles = context.dragHandles,
            record,
            wasSelected;

         for (let i = 0; i < instance.records.length; i++) {
            record = instance.records[i];
            if (record.type == 'data') {
               let row = record.row = instance.getChild(context, this.row, record.key, record.store);
               wasSelected = row.selected;
               row.selected = instance.isSelected(record.data, record.index);
               if (this.cached && row.cached && row.cached.record && row.cached.record.data == record.data && !row.childStateDirty) {
                  row.shouldUpdate = false;
               } else {
                  context.dragHandles = [];
                  row.explore(context);
                  row.shouldUpdate |= wasSelected != record.selected;
                  row.dragHandles = context.dragHandles;
               }
            }
         }
         context.dragHandles = dragHandles;
      }

      context.parentPositionChangeEvent = parentPositionChangeEvent;
   }

   prepare(context, instance) {
      if (!this.buffered && (!this.cached || instance.shouldUpdate)) {
         for (let i = 0; i < instance.records.length; i++) {
            let record = instance.records[i];
            if (record.row && (record.row.shouldUpdate || !this.cached))
               record.row.prepare(context);
         }
      }
      instance.columns.forEach(c => c.prepare(context));
      super.prepare(context, instance);
   }

   cleanup(context, instance) {
      if (!this.buffered && (!this.cached || instance.shouldUpdate)) {
         for (let i = 0; i < instance.records.length; i++) {
            let record = instance.records[i];
            if (record.row && (record.row.shouldUpdate || !this.cached)) {
               record.row.cleanup(context);
               record.row.cached.record = record;
            }
         }
      }
      instance.columns.forEach(c => c.cleanup(context));
      super.cleanup(context, instance);
   }

   groupBy(grouping, {autoConfigure} = {}) {
      if (grouping) {
         if (!isArray(grouping)) {
            if (isString(grouping) || typeof grouping == 'object')
               return this.groupBy([grouping]);
            throw new Error('DynamicGrouping should be an array or grouping objects');
         }

         grouping = grouping.map((g, i) => {
            if (isString(g)) {
               return {
                  key: {
                     [g]: {
                        bind: this.recordName + '.' + g
                     }
                  },
                  showHeader: i == grouping.length - 1,
                  showFooter: true,
                  caption: {tpl: '{$group.' + g + '}'},
                  text: {tpl: '{$record.' + g + '}'}
               }
            }
            return g;
         });

         initGrouping(grouping);
      }

      if (autoConfigure)
         this.showHeader = !isArray(grouping) || !grouping.some(g => g.showHeader);

      this.dataAdapter.groupBy(grouping);
      this.update();
   }

   render(context, instance, key) {
      let {data, refs} = instance;


      let fixedHeader = data.scrollable && this.showHeader && this.renderHeader(context, instance, 'header', {
            fixed: true,
            refs: refs.fixed,
            originalRefs: refs.header
         });

      if (!this.buffered)
         this.renderRows(context, instance);

      refs.header = {};
      let header = this.showHeader && this.renderHeader(context, instance, 'header', {refs: refs.header});

      return (
         <GridComponent
            key={key}
            instance={instance}
            data={instance.data}
            shouldUpdate={instance.shouldUpdate}
            header={header}
            headerRefs={refs.header}
            fixedHeader={fixedHeader}
            fixedHeaderRefs={refs.fixed}/>
      )
   }

   renderHeader(context, instance, key, {fixed, refs, originalRefs}) {
      let {data, widget} = instance;
      if (!refs)
         refs = {};
      let {CSS, baseClass} = widget;

      let result = [[], [], []];
      let skip = {};

      let empty = [true, true, true];

      instance.columns.forEach((columnInstance, i) => {

         let c = columnInstance.widget;

         for (let l = 0; l < 3; l++) {

            let colKey = `${i}-${l}`;

            if (skip[colKey])
               continue;

            let header = columnInstance.components[`header${l + 1}`];
            let colSpan, rowSpan, style, cls, mods = [], content, sortIcon, tool;

            if (header) {
               empty[l] = false;

               if (header.widget.align)
                  mods.push('aligned-' + header.widget.align);
               else if (c.align)
                  mods.push('aligned-' + c.align);

               if (c.sortable && header.widget.allowSorting) {
                  mods.push('sortable');

                  if (data.sorters && data.sorters[0].field == (c.sortField || c.field)) {
                     mods.push('sorted-' + data.sorters[0].direction.toLowerCase());
                     sortIcon = <DropDownIcon className={CSS.element(baseClass, 'column-sort-icon')}/>
                  }
               }

               style = header.data.style;
               if (header.data.classNames)
                  cls = header.data.classNames;

               content = header.render(context);

               if (header.components && header.components.tool) {
                  tool = <div
                     className={CSS.element(baseClass, 'col-header-tool')}>{getContent(header.components.tool.render(context))}
                  </div>;
                  mods.push('tool');
               }

               if (fixed && originalRefs[colKey]) {
                  let width = originalRefs[colKey].offsetWidth + 'px';
                  style = {...style, width, minWidth: width, maxWidth: width}
               }

               if (header.data.colSpan > 1 || header.data.rowSpan > 1) {
                  colSpan = header.data.colSpan;
                  rowSpan = header.data.rowSpan;

                  for (let r = 0; r < header.data.rowSpan; r++)
                     for (let c = 0; c < header.data.colSpan; c++)
                        skip[`${i + c}-${l + r}`] = true;
               }
            }

            cls = CSS.element(baseClass, 'col-header', mods) + (cls ? ' ' + cls : '');

            result[l].push(<th key={i}
               ref={c => {
                  refs[colKey] = c
               }}
               colSpan={colSpan}
               rowSpan={rowSpan}
               className={cls}
               style={style}
               onClick={e => this.onHeaderClick(e, c, instance, l)}
            >
               {getContent(content)}
               {sortIcon}
               {tool}
            </th>);
         }
      });

      result = result.filter((_, i) => !empty[i]);

      if (fixed && result[0])
         result[0].push(<th key="dummy"
            rowSpan={result.length}
            className={CSS.element(baseClass, "col-header")}
            ref={el => {
               refs.last = el
            }}/>);

      return <tbody key={'h' + key} className={CSS.element(baseClass, 'header')}>
      {result.map((h, i) => <tr key={i}>{h}</tr>)}
      </tbody>;
   }

   onHeaderClick(e, column, instance, headerLine) {
      e.preventDefault();
      e.stopPropagation();

      let {data} = instance;
      let header = column[`header${headerLine + 1}`];

      if (header.allowSorting && column.sortable && (column.field || column.sortField || column.value)) {
         let sortField = column.sortField || column.field;
         let dir = 'ASC';
         if (data.sorters && data.sorters[0].field == sortField && (data.sorters[0].value == column.value || data.sortField) && data.sorters[0].direction == 'ASC')
            dir = 'DESC';

         let sorters = [{
            field: sortField,
            direction: dir,
            value: column.value
         }];

         instance.set('sorters', sorters);
         instance.set('sortField', sortField);
         instance.set('sortDirection', dir);

         if (!this.remoteSort)
            instance.setState({sorters});
      }
   }

   renderGroupHeader(context, instance, g, level, group, i, store) {
      let {CSS, baseClass} = this;
      let data = store.getData();
      let caption = g.caption(data);
      return <tbody key={`g-${level}-${i}`} className={CSS.element(baseClass, 'group-caption', ['level-' + level])}>
      <tr>
         <td colSpan={instance.columns.length}>{caption}</td>
      </tr>
      </tbody>;
   }

   renderGroupFooter(context, instance, g, level, group, i, store) {
      let {CSS, baseClass} = this;
      let data = store.getData();
      let skip = 0;
      return <tbody key={'f' + i} className={CSS.element(baseClass, 'group-footer', ['level-' + level])}>
      <tr>
         {
            instance.columns.map((ci, i) => {
               if (--skip >= 0)
                  return null;

               let v, c = ci.widget, colSpan, pad;
               if (c.footer) {
                  v = c.footer.value(data);
                  pad = c.footer.pad;
                  colSpan = c.footer.colSpan;

                  if (c.footer.expand) {
                     colSpan = 1;
                     for (let ind = i + 1; ind < instance.columns.length && !instance.columns[ind].widget.footer && !instance.columns[ind].widget.aggregate; ind++)
                        colSpan++;
                  }

                  if (colSpan > 1)
                     skip = colSpan - 1;
               }
               else if (c.aggregate && c.aggregateField) {
                  v = group[c.aggregateField];
                  if (isString(ci.data.format))
                     v = Format.value(v, ci.data.format);
               }

               let cls = '';
               if (c.align)
                  cls += CSS.state('aligned-' + c.align);

               if (pad !== false)
                  cls += (cls ? ' ' : '') + CSS.state('pad');

               return <td
                  key={i}
                  className={cls}
                  colSpan={colSpan}
               >
                  {v}
               </td>;
            })
         }
      </tr>
      </tbody>;
   }

   renderRows(context, instance) {

      let {records} = instance;

      if (!isArray(records))
         return null;

      let record, g;

      for (let i = 0; i < records.length; i++) {
         record = records[i];
         if (record.type == 'data')
            record.vdom = getContent(record.row.render(context, record.key));

         if (record.type == 'group-header') {
            record.vdom = [];
            g = record.grouping;
            if (g.caption)
               record.vdom.push(this.renderGroupHeader(context, instance, g, record.level, record.group, record.key + '-caption', record.store));

            if (g.showHeader)
               record.vdom.push(this.renderHeader(context, instance, record.key + '-header', {}));
         }

         if (record.type == 'group-footer') {
            g = record.grouping;
            if (g.showFooter)
               record.vdom = this.renderGroupFooter(context, instance, g, record.level, record.group, record.key + '-footer', record.store);
         }
      }
   }

   mapRecords(context, instance) {
      let {data, store} = instance;

      let filter = null;
      if (this.onCreateFilter)
         filter = instance.invoke("onCreateFilter", data.filterParams, instance);

      let sorters = !this.remoteSort && data.sorters;

      this.dataAdapter.setFilter(filter);
      this.dataAdapter.sort(sorters);

      //if no filtering or sorting applied, let the component maps records on demand
      if (this.buffered && !filter && !isNonEmptyArray(sorters))
         return null;

      return this.dataAdapter.getRecords(context, instance, data.records, store);
   }

   mapRecord(context, instance, data, index) {
      return this.dataAdapter.mapRecord(context, instance, data, instance.store, this.recordsBinding, index);
   }
}

Grid.prototype.baseClass = 'grid';
Grid.prototype.showHeader = true;
Grid.prototype.showFooter = false;
Grid.prototype.recordName = '$record';
Grid.prototype.remoteSort = false;
Grid.prototype.lockColumnWidths = false;
Grid.prototype.lockColumnWidthsRequiredRowCount = 3;
Grid.prototype.focused = false;
Grid.prototype.emptyText = false;
Grid.prototype.showBorder = false; // show border override for material theme
Grid.prototype.cached = false;
Grid.prototype.buffered = false;
Grid.prototype.bufferStep = 15;
Grid.prototype.bufferSize = 60;
Grid.prototype.pageSize = 120;
Grid.prototype.bufferedLoading = false;

Widget.alias('grid', Grid);
Localization.registerPrototype('cx/widgets/Grid', Grid);

class GridComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      this.dom = {};
      let {widget} = props.instance;

      this.state = {
         cursor: widget.focused && widget.selectable ? 0 : -1,
         focused: widget.focused,
         dragInsertionIndex: null,
         start: 0,
         end: widget.bufferSize
      };

      this.syncBuffering = false;

      if (widget.bufferedLoading) {
         this.start = 0;
         this.end = widget.bufferSize;
         this.syncBuffering = false; //control with a flag
      }

      this.scrollerRef = el => {
         this.dom.scroller = el;
      }
   }

   render() {
      let {instance, data} = this.props;
      let {widget} = instance;
      let {CSS, baseClass} = widget;
      let {dragSource} = data;
      let {dragged, start, end, cursor} = this.state;

      if (this.syncBuffering) {
         start = this.start;
         end = this.end;
      }

      let children = [];

      let addRow = (record, i) => {
         let {store, key, row} = record;
         let isDragged = dragged && (row.selected || record == dragged);
         let mod = {
            selected: row.selected,
            dragged: isDragged,
            draggable: dragSource && row.dragHandles.length == 0,
            cursor: i == cursor
         };

         children.push(
            <GridRowComponent
               key={key}
               className={CSS.expand(row.data.classNames, CSS.state(mod))}
               store={store}
               dragSource={dragSource}
               instance={row}
               grid={instance}
               record={record}
               parent={this}
               cursorIndex={i}
               selected={row.selected}
               isBeingDragged={dragged}
               cursor={mod.cursor}
               shouldUpdate={row.shouldUpdate}
            >
               {record.vdom}
            </GridRowComponent>
         );
      };
      if (widget.buffered) {
         let context = new RenderingContext();
         let dataCls = CSS.element(baseClass, "data");
         this.getRecordsSlice(start, end).forEach((r, i) => {
            if (r == null) {
               addRow({row: {data: { classNames: dataCls }},
                  vdom: <tr>
                     <td className="cxs-pad" colSpan={1000}>&nbsp;</td>
                  </tr>
               }, start + i)
            } else {
               let record = instance.records ? r : widget.mapRecord(context, instance, r, widget.bufferedLoading ? start + i - data.offset : start + i);
               let row = record.row = instance.getChild(context, widget.row, record.key, record.store);
               let wasSelected = row.selected;
               record.vdom = row.vdom = row.vdom && widget.cached && row.cacheBuster === record.data ? row.vdom : Widget.renderInstance(row, { name: 'grid-row'});
               row.selected = instance.isSelected(record.data, record.index);
               row.cacheBuster = record.data;
               if (row.selected != wasSelected)
                  row.shouldUpdate = true;
               addRow(record, start + i);
            }
         });
      }
      else {
         instance.records.forEach((record, i) => {
            if (record.type == 'data') {
               addRow(record, i);
            }
            else
               children.push(record.vdom);
         });
      }

      if (this.state.dragInsertionIndex != null) {
         let dragInsertionRow = (
            <tbody key="dropzone">
            <tr>
               <td
                  className={CSS.element(baseClass, 'dropzone')}
                  colSpan={1000}
                  style={{
                     height: data.dropMode == 'insertion' ? 0 : this.state.dragItemHeight,
                  }}>
               </td>
            </tr>
            </tbody>
         );
         children.splice(this.state.dragInsertionIndex, 0, dragInsertionRow);
      }

      let content = [];

      if (children.length == 0 && data.emptyText) {
         children.push(
            <tbody
               key="empty"
               className={CSS.element(baseClass, 'empty-text')}
            >
            <tr>
               <td colSpan={1000}>
                  {data.emptyText}
               </td>
            </tr>
            </tbody>
         );
      }

      let marginTop = -(this.headerHeight || 0), marginBottom = null;
      if (this.rowHeight > 0) {
         marginTop += this.rowHeight * start;
         marginBottom = (data.totalRecordCount - (start + children.length)) * this.rowHeight;
      }

      console.log('RENDER', start, end, marginTop, marginBottom);

      content.push(
         <div
            key="scroller"
            ref={this.scrollerRef}
            style={{
               marginTop: this.headerHeight
            }}
            tabIndex={widget.selectable ? 0 : null}
            onScroll={::this.onScroll}
            className={CSS.element(baseClass, 'scroll-area', { "fixed-header": !!this.dom.fixedHeader })}
            onKeyDown={::this.handleKeyDown}
            onMouseLeave={::this.handleMouseLeave}
            onFocus={::this.onFocus}
            onBlur={::this.onBlur}
         >
            <table
               ref={el => {
                  this.dom.table = el
               }}
               style={{
                  marginTop,
                  marginBottom
               }}
            >
               {this.props.header}
               {children}
            </table>
         </div>
      );

      if (this.props.fixedHeader)
         content.push(<div
            key="fh"
            ref={el => {
               this.dom.fixedHeader = el
            }}
            className={CSS.element(baseClass, 'fixed-header')}
            style={{
               display: this.scrollWidth > 0 ? 'block' : 'none'
            }}
         >
            <table>
               {this.props.fixedHeader}
            </table>
         </div>);


      return <div className={data.classNames}
         style={data.style}>
         {content}
      </div>
   }

   getRecordsSlice(start, end) {
      let {data, instance} = this.props;
      let {widget} = instance;
      if (!widget.bufferedLoading) {
         let source = instance.records || data.records;
         return source.slice(start, end);
      }

      let {offset, records} = data;
      let result = [];
      for (let i = start; i < end; i++) {
         if (i >= offset && i < offset + records.length)
            result.push(records[i - offset]);
         else
            result.push(null);
      }

      return result;
   }

   ensureData(offset) {
      this.lastOffset = offset;

      if (this.loading)
         return;

      let {instance, data} = this.props;
      let {widget} = instance;
      let {pageSize} = widget;

      let startPage = Math.trunc(offset / pageSize),
         endPage = Math.trunc((offset + pageSize - 1) / pageSize);

      //debouncing restricts excessive page loading on fast scrolling when rendering data is
      //useless because visible region is scrolled away before data appears
      //the user should spent some time on the page before loading it

      if (!this.loadPageRange)
         this.loadPageRange = debounce((startPage, endPage) => {
            let {records, offset} = data;
            let promises = [];

            for (let page = startPage; page <= endPage; page++) {
               let s = page * pageSize, e = s + pageSize;
               if (s >= offset && e <= offset + records.length) {
                  promises.push(Promise.resolve(records.slice(s - offset, e - offset)));
               } else {
                  let data = instance.invoke("onLoadRecordsPage", {
                     page: page + 1,
                     pageSize: pageSize
                  }, instance);
                  promises.push(Promise.resolve(data));
               }
            }

            this.loading = true;

            Promise.all(promises)
               .then(pageRecords => {
                  this.loading = false;
                  let records = [];
                  pageRecords.forEach(list => {
                     records.push(...list)
                  });
                  instance.store.silently(() => {
                     instance.set('records', records);
                     instance.set('offset', startPage * pageSize);
                     data.records = records;
                     data.offset = startPage * pageSize;
                  });
                  this.setState({
                     startPage, endPage
                  }, () => {
                     this.loadingStartPage = startPage;
                     this.loadingEndPage = endPage;
                     this.ensureData(this.lastOffset);
                  });
               })
               .catch(error => {
                  this.loading = false;
                  if (widget.onLoadingError)
                     instance.invoke(error, "onLoadingError", instance);
               })
         }, 30);

      if (startPage != this.loadingStartPage || endPage != this.loadingEndPage) {
         this.loadingStartPage = startPage;
         this.loadingEndPage = endPage;
         this.loadPageRange(startPage, endPage);
      }
   }

   onScroll() {
      if (this.dom.fixedHeader) {
         this.dom.fixedHeader.scrollLeft = this.dom.scroller.scrollLeft;
      }

      let {instance, data} = this.props;
      let {widget} = instance;
      if (widget.buffered && this.rowHeight > 0 && !this.pending) {
         let start = Math.round(this.dom.scroller.scrollTop / this.rowHeight - widget.bufferStep);
         start = Math.round(start / widget.bufferStep) * widget.bufferStep;
         start = Math.max(0, Math.min(start, data.totalRecordCount - widget.bufferSize));
         let end = start + widget.bufferSize;

         if (widget.bufferedLoading) {
            this.ensureData(start);
            // if (instance.set('loadingOffset', start)) {
            //    //console.log("SCROLL", start, end);
            // }
         }

         if (this.syncBuffering) {
            this.start = start;
            this.end = end;
         }
         else if (this.state.end != end) {
            this.pending = true;
            this.setState({start, end}, () => {
               this.pending = false;
               setTimeout(::this.onScroll, 0);
            });
         }
      }
   }

   shouldComponentUpdate(props, state) {
      return props.shouldUpdate !== false || state != this.state;
   }

   componentDidMount() {
      this.componentDidUpdate();
      let {instance} = this.props;
      let {widget} = instance;
      if (widget.scrollable)
         this.offResize = ResizeManager.subscribe(::this.componentDidUpdate);
      if (widget.pipeKeyDown)
         instance.invoke("pipeKeyDown", ::this.handleKeyDown, instance);
      this.unregisterDropZone = registerDropZone(this);
   }

   onDragStart(e) {
      let {instance} = this.props;
      let {widget} = instance;
      if (widget.onDragStart)
         instance.invoke("onDragStart", e, instance);
   }

   onDrop(e) {
      let {instance} = this.props;
      let {widget} = instance;
      if (widget.onDrop) {
         e.target = {
            insertionIndex: this.state.dragInsertionIndex
         };
         instance.invoke("onDrop", e, instance);
      }
   }

   onDropTest(e) {
      let {instance} = this.props;
      let {widget} = instance;
      if (widget.onDropTest)
         return instance.invoke("onDropTest", e, instance);
      return true;
   }

   onDragEnd(e) {
      this.setState({
         dragInsertionIndex: null,
         lastDragInsertionIndex: null
      });
      let {instance} = this.props;
      let {widget} = instance;
      if (widget.onDragEnd)
         instance.invoke("onDragEnd", e, instance);
   }

   onDragMeasure(e) {
      let r = this.dom.scroller.getBoundingClientRect();
      let {clientX, clientY} = e.cursor;

      if (clientX < r.left || clientX >= r.right || clientY < r.top || clientY >= r.bottom)
         return false;

      return {
         over: 1000
      };
   }

   onDragOver(ev) {
      let {CSS, baseClass} = this.props.instance.widget;
      let rowClass = CSS.element(baseClass, 'data');
      let nodes = Array.from(this.dom.scroller.firstChild.childNodes)
         .filter(node => node.className && node.className.indexOf(rowClass) != -1);

      let cy = ev.cursor.clientY;
      let s = 0, e = nodes.length, m, b;

      while (s < e) {
         m = Math.floor((s + e) / 2);
         b = nodes[m].getBoundingClientRect();

         //dragged items might be invisible and have no client bounds
         if (b.top == 0 && b.bottom == 0) {
            if (m > s)
               m--;
            else if (m + 1 < e)
               m = m + 1;
            else {
               s = e = m;
               break;
            }
            b = nodes[m].getBoundingClientRect();
         }

         if (cy < b.top)
            e = m;
         else if (cy > b.bottom)
            s = m + 1;
         else {
            if (cy > (b.bottom + b.top) / 2)
               s = e = m + 1;
            else {
               s = e = m;
            }
         }
      }

      if (s != this.state.dragInsertionIndex) {
         this.setState({
            dragInsertionIndex: s,
            dragItemHeight: ev.source.height - 1
         });
      }
   }

   onDragLeave(e) {
      this.setState({
         dragInsertionIndex: null
      });
   }

   onGetHScrollParent() {
      let {widget} = this.props.instance;
      if (widget.scrollable)
         return this.dom.scroller;
      return findScrollableParent(this.el, true);
   }

   onGetVScrollParent() {
      let {widget} = this.props.instance;
      if (widget.scrollable)
         return this.dom.scroller;
      return findScrollableParent(this.el);
   }

   componentWillReceiveProps(props) {
      let {data, widget} = props.instance;
      this.setState({
         cursor: Math.max(Math.min(this.state.cursor, data.totalRecordCount - 1), widget.selectable && this.state.focused ? 0 : -1)
      });
   }

   componentWillUnmount() {
      let {instance} = this.props;
      let {widget} = instance;
      if (this.offResize)
         this.offResize();

      offFocusOut(this);

      if (this.unregisterDropZone)
         this.unregisterDropZone();

      if (widget.pipeKeyDown)
         instance.invoke("pipeKeyDown", null, instance);
   }

   componentDidUpdate() {
      let {headerRefs, fixedHeaderRefs, instance, data} = this.props;
      let {widget} = instance;

      if (widget.lockColumnWidths && headerRefs && isArray(data.records) && data.records.length >= widget.lockColumnWidthsRequiredRowCount) {
         for (let k in headerRefs) {
            let c = headerRefs[k];
            c.style.width = c.offsetWidth + 'px';
         }
      }

      if (widget.scrollable) {
         this.scrollWidth = this.dom.scroller.offsetWidth - this.dom.scroller.clientWidth;


         let resized = false, headerHeight = 0, rowHeight = 0;

         if (headerRefs) {
            for (let k in headerRefs) {
               headerHeight = headerRefs[k].offsetHeight;
               break;
            }
         }

         if (this.dom.fixedHeader) {
            for (let k in headerRefs) {
               let c = headerRefs[k];
               let fhe = fixedHeaderRefs[k];
               if (fhe) {
                  let w = c.offsetWidth + 'px';
                  if (w !== fhe.style.width) {
                     fhe.style.width = fhe.style.minWidth = fhe.style.maxWidth = w;
                     resized = true;
                  }
               }
            }
            this.dom.fixedHeader.style.display = 'block';
            if (fixedHeaderRefs.last)
               fixedHeaderRefs.last.style.width = fixedHeaderRefs.last.style.minWidth = this.scrollWidth + 'px';
            this.dom.scroller.style.marginTop = `${headerHeight}px`;
         }

         if (widget.buffered) {
            let {start, end} = this.state;
            if (this.syncBuffering) {
               start = this.start;
               end = this.end;
            }
            let remaining = 0,
               count = Math.min(data.totalRecordCount, end - start);
            if (count == 0) {
               delete this.rowHeight;
               this.dom.scroller.scrollTop = 0;
            } else {
               rowHeight = Math.round((this.dom.table.offsetHeight - headerHeight) / count);
               if (this.rowHeight && this.rowHeight != rowHeight) {
                  console.warn("ROW-HEIGHT-CHANGE", this.rowHeight, rowHeight);
                  // if (rowHeight < this.rowHeight)
                  //    rowHeight = this.rowHeight;
                  // rowHeight = 35;
               }
               remaining = Math.max(0, data.totalRecordCount - end);
            }
            this.dom.table.style.marginTop = `${ -headerHeight + start * rowHeight }px`;
            this.dom.table.style.marginBottom = `${ remaining * this.headerHeight }px`;
         } else {
            this.dom.table.style.marginTop = `${-headerHeight}px`;
         }

         this.headerHeight = headerHeight;
         this.rowHeight = rowHeight;

         this.onScroll();

         if (resized)
            instance.fixedHeaderResizeEvent.notify();
      }
   }

   moveCursor(index, focused, scrollIntoView) {
      let {widget} = this.props.instance;
      if (!widget.selectable)
         return;

      if (focused != null && this.state.focused != focused)
         this.setState({
            focused: focused || widget.focused
         });

      this.setState({
         cursor: index
      }, () => {
         if (scrollIntoView) {
            let start = !widget.buffered ? 0 : this.syncBuffering ? this.start : this.state.start;
            let item = this.dom.scroller.firstChild.children[index + 1 - start];
            if (item)
               scrollElementIntoView(item);
         }
      });
   }

   showCursor(focused) {
      let {records, isSelected} = this.props.instance;
      if (this.state.cursor == -1 && records) {
         let cursor = records.findIndex(x => isSelected(x.data, x.index));
         //if there are no selected records, find the first data record (skip group header)
         if (cursor == -1)
            cursor = records.findIndex(x => x.type == 'data');
         this.moveCursor(cursor, true, true);
      }
   }

   onFocus() {
      FocusManager.nudge();
      this.showCursor(true);

      let {widget} = this.props.instance;
      if (!widget.focused)
         oneFocusOut(this, this.dom.scroller, () => {
            this.moveCursor(-1, false);
         });

      this.setState({
         focused: true
      });
   }

   onBlur() {
      FocusManager.nudge();
   }

   handleMouseLeave() {
      if (!this.state.focused)
         this.moveCursor(-1);
   }

   handleKeyDown(e) {

      let {instance, data} = this.props;
      let {records, widget} = instance;

      if (this.onKeyDown && instance.invoke("onKeyDown", e, instance) === false)
         return;

      switch (e.keyCode) {
         case KeyCode.enter:
            let record = records[this.state.cursor];
            if (record)
               widget.selection.select(instance.store, record.data, record.index, {
                  toggle: e.ctrlKey
               });
            break;

         case KeyCode.down:
            if (this.state.cursor + 1 < data.totalRecordCount) {
               this.moveCursor(this.state.cursor + 1, true, true);
               e.stopPropagation();
               e.preventDefault();
            }
            break;

         case KeyCode.up:
            if (this.state.cursor > 0) {
               this.moveCursor(this.state.cursor - 1, true, true);
               e.stopPropagation();
               e.preventDefault();
            }
            break;
      }
   }

   beginDragDrop(e, record) {

      let {instance, data} = this.props;
      let {widget, store, isSelected} = instance;
      let {CSS, baseClass} = widget;

      let selected = instance.records.filter(record => isSelected(record.data, record.index));

      if (selected.length == 0)
         selected = [record];

      let contents = selected
         .map((record, i) => (
            <tbody
               key={i}
               className={CSS.element(baseClass, 'data', {selected: !widget.selection.isDummy})}
            >
            {record.vdom}
            </tbody>
         ));

      initiateDragDrop(e, {
         sourceEl: e.currentTarget,
         source: {
            data: data.dragSource.data,
            store: store,
            record: record,
            records: selected
         },
         clone: {
            store: record.store,
            widget: props => (
               <div className={data.classNames}>
                  <table>
                     {contents}
                  </table>
               </div>
            )
         }
      }, () => {
         this.setState({
            dragged: false
         })
      });

      this.setState({
         dragged: record
      })
   }
}

class GridColumnHeader extends PureContainer {
   initComponents() {
      if (this.header)
         this.header1 = this.header;

      if (this.header1 && isSelector(this.header1))
         this.header1 = {
            text: this.header1 || ''
         };

      if (this.header2 && isSelector(this.header2))
         this.header2 = {
            text: this.header2 || ''
         };

      if (this.header3 && isSelector(this.header3))
         this.header3 = {
            text: this.header3 || ''
         };

      return super.initComponents({
         header1: this.header1 && GridHeaderCell.create(this.header1),
         header2: this.header2 && GridHeaderCell.create(this.header2),
         header3: this.header3 && GridHeaderCell.create(this.header3),
      })
   }
}

class GridHeaderCell extends PureContainer {
   declareData() {
      return super.declareData(...arguments, {
         text: undefined,
         style: {structured: true},
         class: {structured: true},
         className: {structured: true},
         colSpan: undefined,
         rowSpan: undefined
      })
   }

   initComponents() {
      return super.initComponents(...arguments, {
         tool: this.tool && Widget.create(this.tool)
      })
   }

   render(context, instance, key) {
      let {data} = instance;
      return data.text || super.render(context, instance, key);
   }
}

GridHeaderCell.prototype.colSpan = 1;
GridHeaderCell.prototype.rowSpan = 1;
GridHeaderCell.prototype.allowSorting = true;

function initGrouping(grouping) {
   grouping.forEach(g => {
      if (g.caption)
         g.caption = getSelector(g.caption);
   })
}



