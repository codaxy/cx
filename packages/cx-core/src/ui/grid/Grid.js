import {Widget, VDOM, getContent} from '../Widget';
import {PureContainer} from '../PureContainer';
import {Binding} from '../../data/Binding';
import {getSelector} from '../../data/getSelector';
import {isSelector} from '../../data/isSelector';
import {Format} from '../../util/Format';
import {Selection} from '../selection/Selection';
import {DataAdapter} from './DataAdapter';
import {GroupAdapter} from './GroupAdapter';
import {ResizeManager} from '../ResizeManager';
import {KeyCode} from '../../util/KeyCode';
import {scrollElementIntoView} from '../../util/scrollElementIntoView';
import {FocusManager, oneFocusOut, offFocusOut} from '../FocusManager';

export class Grid extends Widget {

   declareData() {

      var selection = this.selection.configureWidget(this);

      super.declareData({
         records: undefined,
         class: { structured: true },
         className: { structured: true },
         style: { structured: true },
         sorters: undefined,
         scrollable: undefined,
         sortField: undefined,
         sortDirection: undefined
      }, selection, ...arguments);
   }

   init() {

      if (this.records && this.records.bind)
         this.recordsBinding = Binding.get(this.records.bind);

      this.columns = Widget.create(GridColumn, this.columns || [], {
         recordName: this.recordName
      });

      this.columns.forEach(c=> {
         c.init();
         if (c.footer != null)
            c.footer = getSelector(c.footer);
      });

      var aggregates = {};
      this.columns.filter(c=>c.aggregate && c.aggregateField).forEach(c=> {
         aggregates[c.aggregateField] = {
            value: c.value != null ? c.value : { bind: this.recordName + '.' + c.field },
            weight: c.weight != null ? c.weight : c.weightField && { bind: this.recordName + '.' + c.weightField },
            type: c.aggregate
         }
      });

      //if some columns have aggregates and grouping is not defined, add default footer
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

      if (this.grouping) {
         this.groupBy(this.grouping)
      }
   }

   initState(context, instance) {
      instance.state = {};
   }

   prepareData(context, instance) {

      var {data, state} = instance;

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

      data.stateMods = {
         selectable: this.selectable,
         scrollable: data.scrollable,
         sortable: this.columns.some(x=>x.sortable)
      };



      super.prepareData(context, instance);

      instance.records = this.mapRecords(context, instance);
   }

   initInstance(context, instance) {
      instance.refs = {
         header: {},
         fixed: {}
      };

      super.initInstance(context, instance);
   }

   explore(context, instance) {
      super.explore(context, instance);

      instance.columns = [];

      this.columns.forEach(c=> {
         var column = instance.getChild(context, c);
         if (column.explore(context))
            instance.columns.push(column);
      });

      var {store} = instance;
      instance.isSelected = this.selection.getIsSelectedDelegate(store);

      var record;
      for (var i = 0; i<instance.records.length; i++) {
         record = instance.records[i];
         if (record.cells) {
            var wasSelected = record.selected;
            record.selected = instance.isSelected(record.data, record.index);
            record.shouldUpdate = wasSelected != record.selected;
            for (var c = 0; c < record.cells.length; c++)
               record.cells[c].explore(context);
         }
      }
   }

   prepare(context, instance) {
      var record, cell;
      for (var i = 0; i < instance.records.length; i++) {
         record = instance.records[i];
         if (record.cells) {
            for (var c = 0; c < record.cells.length; c++) {
               cell = record.cells[c];
               cell.prepare(context);
               if (cell.shouldUpdate)
                  record.shouldUpdate = true;
               if (record.shouldUpdate)
                  instance.shouldUpdate = true;
            }
         }
      }
      instance.columns.forEach(c=>c.prepare(context));
      super.prepare(context, instance);
   }

   cleanup(context, instance) {
      var record;
      for (var i = 0; i < instance.records.length; i++) {
         record = instance.records[i];
         if (record.cells) {
            for (var c = 0; c < record.cells.length; c++)
               record.cells[c].cleanup(context);
         }
      }
      instance.columns.forEach(c=>c.cleanup(context));
      super.cleanup(context, instance);
   }

   groupBy(grouping, {autoConfigure} = {}) {
      if (grouping) {
         if (!Array.isArray(grouping)) {
            if (typeof grouping == 'string' || typeof grouping == 'object')
               return this.groupBy([grouping]);
            throw new Error('DynamicGrouping should be an array or grouping objects');
         }

         grouping = grouping.map((g, i)=> {
            if (typeof g == 'string') {
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
         this.showHeader = !Array.isArray(grouping) || !grouping.some(g=>g.showHeader);

      this.dataAdapter.groupBy(grouping);
      this.update();
   }

   render(context, instance, key) {
      var {data, refs} = instance;


      var fixedHeader = data.scrollable && this.showHeader && this.renderHeader(context, instance, 'header', {
            fixed: true,
            refs: refs.fixed,
            originalRefs: refs.header
         });

      this.renderRows(context, instance);

      refs.header = {};
      refs.header2 = {};
         var header = this.showHeader && this.renderHeader(context, instance, 'header', {refs: refs.header});

      return <GridComponent key={key}
                            instance={instance}
                            header={header}
                            headerRefs={refs.header}
                            fixedHeader={fixedHeader}
                            fixedHeaderRefs={refs.fixed} />
   }


      renderHeader(context, instance, key, {fixed, refs, originalRefs}) {
         var {data, store, widget} = instance;
         if (!refs)
            refs = {};
         var {CSS, baseClass} = widget;

         var results = [];
         var headers = [];
         var headers2 = [];

         var skip = 0;
         var skip2 = 0;

         var header2exists = 0;

         instance.columns.forEach((columnInstance, i) => {

            if(columnInstance.header2){
            if (skip--)
               return;

            if (skip2--)
               return;

            var c = columnInstance.widget;
            var header = columnInstance.header;
            var header2 = columnInstance.header2;

            if(header2.data.text != "")
               header2exists++;
            var mods = [];
            var mods2 = [];

            if (header.widget.align)
               mods.push('aligned-' + header.widget.align);
            else if (c.align)
               mods.push('aligned-' + c.align);

            if (header2.widget.align)
               mods2.push('aligned-' + header2.widget.align);
            else if (c.align)
               mods2.push('aligned-' + c.align);

            if (c.sortable) {
               mods.push('sortable');
               mods2.push('sortable');

               if (data.sorters && data.sorters[0].field == (c.sortField || c.field)) {
                  mods.push('sorted-' + data.sorters[0].direction.toLowerCase());
                  mods2.push('sorted-' + data.sorters[0].direction.toLowerCase());
               }
            }

            var style = header.data.style;
            var style2 = header2.data.style;
            var cls = CSS.element(baseClass, 'col-header', mods);
            var cls2 = CSS.element(baseClass, 'col-header2', mods2);

            if (header.data.classNames)
               cls += ' ' + header.data.classNames;

            if (header2.data.classNames) {
               cls2 += ' ' + header2.data.classNames;
            }
            var content = header.render(context);
            var content2 = header2.render(context);



            if (fixed && originalRefs[i]) {
               style = {...style, width: originalRefs[i].offsetWidth + 'px'}
            }

            if (fixed && originalRefs[i]) {
               style2 = {...style2, width: originalRefs[i].offsetWidth + 'px'}
            }

            skip = header.data.colSpan - 1;
            skip2 = header2.data.colSpan - 1;

            headers.push(<th key={i}
                            ref={c=> {
                            refs[i] = c
                         }}
                            colSpan={header.data.colSpan}
                            className={cls}
                            style={style}
                            onClick={e=>this.onHeaderClick(e, c, store, instance)}>
               {getContent(content)}
            </th>);

            headers2.push(<th key={i}
                             ref={c=> {
                            refs[i] = c
                         }}
                             colSpan={header2.data.colSpan}
                             className={cls2}
                             style={style2}
                             onClick={e=>this.onHeaderClick(e, c, store, instance)}>
               {getContent(content2)}
            </th>);

         }
            else
            {
                  if (skip--)
                     return;

                  var c = columnInstance.widget;
                  var header = columnInstance.header;
                  var mods = [];

                  if (header.widget.align)
                     mods.push('aligned-' + header.widget.align);
                  else if (c.align)
                     mods.push('aligned-' + c.align);

                  if (c.sortable) {
                     mods.push('sortable');

                     if (data.sorters && data.sorters[0].field == (c.sortField || c.field)) {
                        mods.push('sorted-' + data.sorters[0].direction.toLowerCase());
                     }
                  }



                  var style = header.data.style;
                  var cls = CSS.element(baseClass, 'col-header', mods);
                  if (header.data.classNames)
                     cls += ' ' + header.data.classNames;

                  var content = header.render(context);

                  if (fixed && originalRefs[i]) {
                     style = {...style, width: originalRefs[i].offsetWidth + 'px'}
                  }

                  skip = header.data.colSpan - 1;

                  headers.push(<th key={i}
                                  ref={c=> {
                            refs[i] = c
                         }}
                                  colSpan={header.data.colSpan}
                                  className={cls}
                                  style={style}
                                  onClick={e=>this.onHeaderClick(e, c, store, instance)}>
                     {getContent(content)}
                  </th>);
            }

         });


         if (fixed)
            headers.push(<th key="dummy" className={CSS.element(baseClass, "col-header")} ref={el=> {
            refs.last = el
         }}/>);

         if (fixed)
            headers2.push(<th key="dummy" className={CSS.element(baseClass, "col-header2")} ref={el=> {
            refs.last = el
         }}/>);

         results.push(<tr>{headers}</tr>);

         if (header2exists > 0)
            results.push(<tr>{headers2}</tr>);

         return <tbody key={'h' + key} className={CSS.element(baseClass, 'header')}>
            {results}
         </tbody>;
      }

   onHeaderClick(e, column, store, instance) {
      e.preventDefault();
      e.stopPropagation();

      var {data} = instance;

      if (column.sortable && (column.field || column.sortField || column.value)) {
         var sortField = column.sortField || column.field;
         var dir = 'ASC';
         if (data.sorters && data.sorters[0].field == sortField && data.sorters[0].value == column.value && data.sorters[0].direction == 'ASC')
            dir = 'DESC';

         var sorters = [{
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
      var {CSS, baseClass} = this;
      var data = store.getData();
      var caption = g.caption(data);
      return <tbody key={`g-${level}-${i}`} className={CSS.element(baseClass, 'group-caption', ['level-' + level])}>
      <tr>
         <td colSpan={instance.columns.length}>{caption}</td>
      </tr>
      </tbody>;
   }

   renderGroupFooter(context, instance, g, level, group, i, store) {
      var {CSS, baseClass} = this;
      var data = store.getData();
      return <tbody key={'f'+i} className={CSS.element(baseClass, 'group-footer', ['level-'+level])}>
      <tr>
         {
            instance.columns.map((ci, i) => {
               var v, c = ci.widget;
               if (c.footer)
                  v = c.footer(data);
               else if (c.aggregate && c.aggregateField)
                  v = group[c.aggregateField];

               if (typeof ci.data.format == 'string')
                  v = Format.value(v, ci.data.format);

               var cls = '';
               if (c.align)
                  cls += CSS.state('aligned-' + c.align);
               return <td key={i} className={cls}>{v}</td>;
            })
         }
      </tr>
      </tbody>;
   }

   renderRows(context, instance) {

      var {records} = instance;

      if (!Array.isArray(records))
         return null;

      var record, g;

      for (var i = 0; i < records.length; i++) {
         record = records[i];
         if (record.type == 'data')
            record.vdom = this.renderRow(context, instance, record);

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

   onRowClick(e, record, index, store) {
      //e.preventDefault();
      e.stopPropagation();
      this.selection.select(store, record, index, {
         toggle: e.ctrlKey
      });
   }

   renderRow(context, instance, record) {

      if (this.memoize && record.shouldUpdate === false && record.vdom)
         return record.vdom;

      var cells = [], ci;

      for (var i = 0; i < record.cells.length; i++) {
         ci = record.cells[i];
         if (!ci.visible)
            continue;
         var c = ci.widget;
         var row = ci.render(context, String(i));
         var v = getContent(row);
         var state = [];
         if (c.align)
            state.push('aligned-' + c.align);
         if (ci.data.pad)
            state.push('pad');
         if (v == null) {
            v = ci.data.value;
            if (ci.data.format)
               v = Format.value(v, ci.data.format);
         }
         var cls = this.CSS.expand(ci.data.classNames, this.CSS.state(state));
         cells.push(<td key={i} className={cls} style={ci.data.style}>{v}</td>);
      }

      return <tr>{cells}</tr>;
   }

   mapRecords(context, instance) {
      var {data, store} = instance;
      this.dataAdapter.sort(!this.remoteSort && data.sorters);
      return this.dataAdapter.getRecords(context, instance, data.records, store).map(record => {
         if (record.type == 'data') {
            record.cells = this.columns.map(c => {
               var cell = instance.getChild(context, c, record.key, record.store)
               cell.repeatable = true;
               return cell;
            });
         }
         return record;
      });
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

Widget.alias('grid', Grid);

class GridComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      this.dom = {};
      var {widget} = props.instance;
      this.state = {
         cursor: widget.focused && widget.selectable ? 0 : -1,
         focused: widget.focused
      }
   }

   render() {
      var {instance} = this.props;
      var {data, widget} = instance;
      var {CSS, baseClass} = widget;

      var children = instance.records.map((record, i)=> {
         if (record.type == 'data') {
            var {data, store, index, key, selected} = record;
            var mod = {
               selected: selected,
               cursor: i == this.state.cursor
            };
            return <GridRowComponent key={key}
                                     className={CSS.element(baseClass, 'data', mod)}
                                     onClick={e=>widget.onRowClick(e, data, index, store)}
                                     onMouseEnter={e=>this.moveCursor(i)}
                                     isSelected={selected}
                                     cursor={mod.cursor}
                                     shouldUpdate={record.shouldUpdate}>
               {record.vdom}
            </GridRowComponent>
         }
         return record.vdom;
      });

      return <div className={data.classNames}
                  style={data.style}>
         <div ref={el=>{this.dom.scroller = el}}
              tabIndex={widget.selectable ? 0 : null}
              onScroll={::this.onScroll}
              className={CSS.element(baseClass, 'scroll-area')}
              onKeyDown={::this.handleKeyDown}
              onMouseLeave={::this.handleMouseLeave}
              onFocus={::this.onFocus}
              onBlur={::this.onBlur}>

            <table ref={el=>{this.dom.table = el}}>
               {this.props.header}
               {children}
            </table>

         </div>
         { this.props.fixedHeader && <div ref={el=>{this.dom.fixedHeader = el}}
                                          className={CSS.element(baseClass, 'fixed-header')}
                                          style={{
                  display: this.scrollWidth > 0 ? 'block' : 'none'
                  }}>
            <table>
               {this.props.fixedHeader}
            </table>
         </div> }
      </div>
   }

   onScroll(e) {
      if (this.dom.fixedHeader) {
         this.dom.fixedHeader.scrollLeft = e.target.scrollLeft;
      }
   }

   shouldComponentUpdate(props, state) {
      return props.instance.shouldUpdate !== false || state != this.state;;
   }

   componentDidMount() {
      this.componentDidUpdate();
      var {widget} = this.props.instance;
      if (widget.scrollable)
         this.offResize = ResizeManager.subscribe(::this.componentDidUpdate);
      if (widget.pipeKeyDown)
         widget.pipeKeyDown(::this.handleKeyDown, this.props.instance);
   }

   componentWillReceiveProps(props) {
      var {records} = props.instance;
      this.setState({
         cursor: Math.max(Math.min(this.state.cursor, records.length - 1), this.state.focused ? 0 : -1)
      });
   }

   componentWillUnmount() {
      var {instance} = this.props;
      var {widget} = instance;
      if (this.offResize)
         this.offResize();
      offFocusOut(this);
      if (widget.pipeKeyDown)
         widget.pipeKeyDown(null, instance);
   }

   componentDidUpdate() {
      var {headerRefs, fixedHeaderRefs, instance}= this.props;
      var {widget, data} = instance;

      if (widget.scrollable) {
         this.scrollWidth = this.dom.scroller.offsetWidth - this.dom.scroller.clientWidth;
         if (widget.lockColumnWidths && headerRefs && Array.isArray(data.records) && data.records.length >= widget.lockColumnWidthsRequiredRowCount) {
            for (var k in headerRefs) {
               var c = headerRefs[k];
               c.style.width = c.offsetWidth + 'px';
            }
         }
         if (this.dom.fixedHeader) {
            for (var k in headerRefs) {
               var c = headerRefs[k];
               var fhe = fixedHeaderRefs[k];
               if (fhe) {
                  fhe.style.width = fhe.style.minWidth = fhe.style.maxWidth = c.offsetWidth + 'px';
               }
            }
            this.dom.fixedHeader.style.display = 'block';
            fixedHeaderRefs.last.style.width = fixedHeaderRefs.last.style.minWidth = this.scrollWidth + 'px';

            var headerHeight = this.dom.fixedHeader.offsetHeight;
            this.dom.table.style.marginTop = `${-headerHeight}px`;
            this.dom.scroller.style.height = `calc(100% - ${headerHeight}px`;
            this.dom.scroller.style.top = `${headerHeight}px`;
         }
      }
   }

   moveCursor(index, focused, scrollIntoView) {
      if (!this.props.instance.widget.selectable)
         return;

      if (focused != null && this.state.focused != focused)
         this.setState({
            focused: focused || this.props.instance.widget.focused
         });

      this.setState({
         cursor: index
      }, () => {
         if (scrollIntoView) {
            var item = this.dom.scroller.firstChild.children[index + 1];
            scrollElementIntoView(item);
         }
      });
   }

   showCursor(focused) {
      if (this.state.cursor == -1) {
         var firstSelected = this.props.instance.records.findIndex(x=>x.selected);
         this.moveCursor(firstSelected != -1 ? firstSelected : 0, focused);
      }
   }


   onFocus() {
      FocusManager.nudge();
      this.showCursor(true);

      var {widget} = this.props.instance;
      if (!widget.focused)
         oneFocusOut(this, this.dom.scroller, ()=> {
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

      var {instance} = this.props;
      var {records, widget} = instance;

      if (this.onKeyDown && this.onKeyDown(e, instance) === false)
         return;

      switch (e.keyCode) {
         case KeyCode.enter:
            var record = records[this.state.cursor];
            if (record)
               widget.onRowClick(e, record.data, record.index, record.store);
            break;

         case KeyCode.down:
            if (this.state.cursor + 1 < records.length) {
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
}

class GridColumn extends PureContainer {
   declareData() {
      return super.declareData(...arguments, {
         style: { structured: true },
         class: { structured: true },
         className: { structured: true },
         value: undefined,
         weight: undefined,
         pad: undefined,
         format: undefined
      })
   }

   init() {
      if (isSelector(this.header))
         this.header = {
            text: this.header || ''
         };

      if (isSelector(this.header2))
         this.header2 = {
            text: this.header2 || ''
         };

      this.header = Widget.create(GridColumnHeader, this.header);
      if(this.header2.text != "")
         this.header2 = Widget.create(GridColumnHeader, this.header2);

      if (!this.value && this.field)
         this.value = { bind: this.recordName + '.' + this.field };

      if (!this.aggregateField && this.field)
         this.aggregateField = this.field;

      super.init();
   }

   initInstance(context, instance) {
      instance.header = instance.getChild(context, this.header);
      if(this.header2.text != "")
         instance.header2 = instance.getChild(context, this.header2);
   }

   explore(context, instance) {
      if (instance.repeatable)
         super.explore(context, instance);
      else {
         instance.header.explore(context);
         if(this.header2.text != "")
            instance.header2.explore(context);
      }
   }

   prepare(context, instance) {
      if (instance.repeatable)
         super.prepare(context, instance);
      else {
         instance.header.prepare(context);
         if(this.header2.text != "")
            instance.header2.prepare(context);
      }
   }

   cleanup(context, instance) {
      if (instance.repeatable)
         super.cleanup(context, instance);
      else {
         instance.header.cleanup(context);
         if(this.header2.text != "")
            instance.header2.cleanup(context);
      }
   }
}

GridColumn.prototype.pad = true;

Grid.Column = GridColumn;

class GridColumnHeader extends PureContainer {
   declareData() {
      return super.declareData(...arguments, {
         text: undefined,
         style: { structured: true },
         class: { structured: true },
         className: { structured: true },
         colSpan: undefined
      })
   }

   render(context, instance, key) {
      var {data} = instance;
      return data.text || super.render(context, instance, key);
   }
}

GridColumnHeader.prototype.colSpan = 1;

function initGrouping(grouping) {
   grouping.forEach(g=> {
      if (g.caption)
         g.caption = getSelector(g.caption);
   })
}

class GridRowComponent extends VDOM.Component {
   render() {
      return <tbody className={this.props.className}
                    onClick={this.props.onClick}
                    onMouseEnter={this.props.onMouseEnter}>
         {this.props.children}
      </tbody>
   }

   shouldComponentUpdate(props) {
      return props.shouldUpdate !== false || props.cursor != this.props.cursor;
   }
}

