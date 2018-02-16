import {Widget, VDOM, getContent} from '../ui/Widget';
import {PureContainer} from '../ui/PureContainer';
import {GroupAdapter} from '../ui/adapter/GroupAdapter';
import {Binding} from '../data/Binding';
import {Selection} from '../ui/selection/Selection';
import {KeyCode} from '../util/KeyCode';
import {scrollElementIntoView} from '../util/scrollElementIntoView';
import {FocusManager, oneFocusOut, offFocusOut, preventFocusOnTouch} from '../ui/FocusManager';
import {isString} from '../util/isString';
import {isArray} from '../util/isArray';

/*
 - renders list of items
 - focusable (keyboard navigation)
 - selection
 - fake focus - list appears focused and receives keyboard inputs redirected from other control (dropdown scenario)
 */


export class List extends Widget {

   init() {
      if (this.recordAlias)
         this.recordName = this.recordAlias;
      
      if (this.indexAlias)
         this.indexName = this.indexAlias;
      
      this.adapter = GroupAdapter.create(this.adapter || GroupAdapter, {
         recordName: this.recordName,
         indexName: this.indexName,
         recordsBinding: this.records && this.records.bind && Binding.get(this.records.bind),
         keyField: this.keyField
      });

      this.child = Widget.create({
         type: PureContainer,
         layout: this.layout,
         items: this.items,
         children: this.children,
         styled: true,
         class: this.itemClass,
         className: this.itemClassName,
         style: this.itemStyle
      });

      delete this.children;

      this.selection = Selection.create(this.selection, {
         records: this.records
      });

      super.init();

      if (this.grouping) {
         this.groupBy(this.grouping)
      }
   }

   declareData() {

      let selection = this.selection.configureWidget(this);

      super.declareData(selection, {
         records: undefined,
         sorters: undefined,
         sortField: undefined,
         sortDirection: undefined,
         filterParams: {
            structured: true
         },
         itemStyle: {
            structured: true
         },
         emptyText: undefined
      }, ...arguments);
   }

   prepareData(context, instance) {
      let {data} = instance;

      if (data.sortField)
         data.sorters = [{
            field: data.sortField,
            direction: data.sortDirection || "ASC"
         }];
      this.adapter.sort(data.sorters);

      let filter = null;
      if (this.onCreateFilter)
         filter = instance.invoke("onCreateFilter", data.filterParams, instance);
      else if (this.filter)
         filter = item => this.filter(item, data.filterParams);
      this.adapter.setFilter(filter);
      instance.mappedRecords = this.adapter.getRecords(context, instance, data.records, instance.store);

      data.stateMods = Object.assign(data.stateMods || {}, {
         selectable: !this.selection.isDummy || this.onItemClick,
         empty: instance.mappedRecords.length == 0
      });

      super.prepareData(context, instance);
   }

   explore(context, instance, data) {
      let instances = [];
      let isSelected = this.selection.getIsSelectedDelegate(instance.store);
      instance.mappedRecords.forEach(record => {
         if (record.type == 'data') {
            let itemInstance = instance.getChild(context, this.child, record.key + ':', record.store);
            itemInstance.record = record;

            if (this.cached && itemInstance.cached && itemInstance.cached.record && itemInstance.cached.record.data == record.data && !itemInstance.childStateDirty) {
               instances.push(itemInstance);
               itemInstance.shouldUpdate = false;
            }
            else if (itemInstance.scheduleExploreIfVisible(context))
               instances.push(itemInstance);

            let selected = isSelected(record.data, record.index);
            if (itemInstance.selected != selected) {
               itemInstance.selected = selected;
               //itemInstance.markShouldUpdate(context);
            }
         }
         else if (record.type == 'group-header' && record.grouping.header) {
            let itemInstance = instance.getChild(context, record.grouping.header, record.key, record.store);
            itemInstance.record = record;
            if (itemInstance.scheduleExploreIfVisible(context))
               instances.push(itemInstance);
         }
         else if (record.type == 'group-footer' && record.grouping.footer) {
            let itemInstance = instance.getChild(context, record.grouping.footer, record.key, record.store);
            itemInstance.record = record;
            if (itemInstance.scheduleExploreIfVisible(context))
               instances.push(itemInstance);
         }
      });
      instance.instances = instances;
   }

   render(context, instance, key) {
      let items = instance.instances.map(x => ({
         instance: x,
         key: x.record.key,
         type: x.record.type,
         content: getContent(x.render(context))
      }));
      return <ListComponent
         key={key}
         instance={instance}
         items={items}
         selectable={!this.selection.isDummy || this.onItemClick}
      />
   }

   groupBy(grouping) {
      if (grouping) {
         if (!isArray(grouping)) {
            if (isString(grouping) || typeof grouping == 'object')
               return this.groupBy([grouping]);
            throw new Error('DynamicGrouping should be an array of grouping objects');
         }

         grouping = grouping.map((g, i) => {
            if (isString(g)) {
               return {
                  key: {
                     [g]: {
                        bind: this.recordName + '.' + g
                     }
                  }
               }
            }
            return g;
         });
      }

      grouping.forEach(g => {
         if (g.header)
            g.header = Widget.create(g.header);

         if (g.footer)
            g.footer = Widget.create(g.footer);
      });

      this.adapter.groupBy(grouping);
      this.update();
   }
}

List.prototype.recordName = '$record';
List.prototype.indexName = '$index';
List.prototype.baseClass = 'list';
List.prototype.focusable = true;
List.prototype.focused = false;
List.prototype.itemPad = true;
List.prototype.cached = false;
List.prototype.styled = true;
List.prototype.scrollSelectionIntoView = false;

Widget.alias('list', List);

class ListComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      let {focused} = props.instance.widget;
      this.state = {
         cursor: focused && props.selectable ? 0 : -1,
         focused: focused
      }
   }

   shouldComponentUpdate(props, state) {
      return props.instance.shouldUpdate || state != this.state;
   }

   componentDidMount() {
      let {instance} = this.props;
      let {widget} = instance;
      if (widget.pipeKeyDown)
         instance.invoke("pipeKeyDown", ::this.handleKeyDown, instance);
   }

   componentWillReceiveProps(props) {
      this.setState({
         cursor: Math.max(Math.min(this.state.cursor, props.items.length - 1), this.state.focused ? 0 : -1)
      });
   }

   componentWillUnmount() {
      let {instance} = this.props;
      let {widget} = instance;
      offFocusOut(this);
      if (widget.pipeKeyDown)
         instance.invoke("pipeKeyDown", null, instance);
   }

   render() {
      let {instance, items, selectable} = this.props;
      let {data, widget} = instance;
      let {CSS, baseClass} = widget;
      let itemStyle = CSS.parseStyle(data.itemStyle);
      this.cursorChildIndex = [];
      let cursorIndex = 0;

      let children = items.length > 0 && items.map((x, i) => {
            let {data, selected} = x.instance;
            let className;

            if (x.type == 'data') {
               let ind = cursorIndex++,
                  onDblClick;

               this.cursorChildIndex.push(i);
               className = CSS.element(baseClass, 'item', {
                  selected: selected,
                  cursor: ind == this.state.cursor,
                  pad: widget.itemPad
               });

               if (widget.onItemDoubleClick)
                  onDblClick = e => { instance.invoke("onItemDoubleClick", e, x.instance)};

               return (
                  <li
                     key={x.key}
                     className={CSS.expand(className, data.classNames)}
                     style={itemStyle}
                     onClick={e => this.handleItemClick(e, x.instance)}
                     onDoubleClick={onDblClick}
                     onMouseDown={e => {
                        this.moveCursor(ind);
                        if (e.shiftKey)
                           e.preventDefault();
                     }}
                     // onMouseEnter={e => {
                     //    this.moveCursor(ind, { hover: true })
                     // }}
                  >
                     {x.content}
                  </li>
               );
            } else {
               return (
                  <li
                     key={x.key}
                     className={CSS.element(baseClass, x.type)}
                  >
                     {x.content}
                  </li>
               );
            }
         });

      if (!children && data.emptyText) {
         children = <li className={CSS.element(baseClass, 'empty-text')}>
            {data.emptyText}
         </li>
      }

      return <ul
         ref={el => {
            this.el = el
         }}
         className={CSS.expand(data.classNames, CSS.state({focused: this.state.focused}))}
         style={data.style}
         tabIndex={widget.focusable && selectable && items.length > 0 ? 0 : null}
         onMouseDown={e=>preventFocusOnTouch(e)}
         onKeyDown={::this.handleKeyDown}
         onMouseLeave={::this.handleMouseLeave}
         onFocus={::this.onFocus}
         onBlur={::this.onBlur}
      >
         {children}
      </ul>;
   }

   componentDidUpdate() {
      let {widget} = this.props.instance;
      if (widget.scrollSelectionIntoView) {
         let {CSS, baseClass} = widget;
         let selectedRowSelector = `.${CSS.element(baseClass, "item")}.${CSS.state("selected")}`;
         let firstSelectedRow = this.el.querySelector(selectedRowSelector);
         if (firstSelectedRow != this.selectedEl) {
            scrollElementIntoView(firstSelectedRow);
            this.selectedEl = firstSelectedRow;
         }
      }
   }

   moveCursor(index, {focused, hover, scrollIntoView, select, selectRange, selectOptions} = {}) {

      let {instance, selectable} = this.props;
      if (!selectable)
         return;

      let {widget} = instance;
      let newState = {};
      if (widget.focused)
         focused = true;

      if (focused != null && this.state.focused != focused)
         newState.focused = focused;

      //ignore mouse enter/leave events (support with a flag if a feature request comes)
      if (!hover)
         newState.cursor = index;

      if (select) {
         let start = selectRange && this.state.selectionStart >= 0 ? this.state.selectionStart : index;
         if (start < 0)
            start = index;
         this.selectRange(start, index, selectOptions);
         if (!selectRange)
            newState.selectionStart = index;
      }

      if (Object.keys(newState).length > 0) {
         this.setState(newState, () => {
            if (scrollIntoView) {
               let item = this.el.children[this.cursorChildIndex[index]];
               if (item)
                  scrollElementIntoView(item);
            }
         });
      }
   }

   selectRange(from, to, options) {
      let {instance, data} = this.props;
      let {mappedRecords, widget} = instance;

      if (from > to) {
         let tmp = from;
         from = to;
         to = tmp;
      }

      let selection = [], indexes = [];

      for (let cursor = from; cursor <= to; cursor++) {
         let record = mappedRecords[cursor];
         if (record) {
            selection.push(record.data);
            indexes.push(record.index);
         }
      }

      widget.selection.selectMultiple(instance.store, selection, indexes, options);
   }

   showCursor(focused) {
      if (this.state.cursor == -1) {
         let firstSelected = this.props.items.findIndex(x => x.instance.selected);
         this.moveCursor(firstSelected != -1 ? firstSelected : 0, { focused: true });
      }
   }

   onFocus() {
      FocusManager.nudge();
      this.showCursor(true);

      let {widget} = this.props.instance;
      if (!widget.focused)
         oneFocusOut(this, this.el, () => {
            this.moveCursor(-1, { focused: false });
         });

      this.setState({
         focused: true
      });
   }

   onBlur() {
      FocusManager.nudge();
   }

   handleMouseLeave() {
      this.moveCursor(-1, { hover: true });
   }

   handleItemClick(e, itemInstance) {
      e.stopPropagation();

      let {instance} = this.props;
      let {widget} = instance;

      if (widget.onItemClick && instance.invoke("onItemClick", e, itemInstance) === false)
         return;

      this.moveCursor(this.state.cursor, {
         select: true,
         selectOptions: {
            toggle: e.ctrlKey
         },
         selectRange: e.shiftKey
      });
   }

   handleKeyDown(e) {

      let {instance, items} = this.props;

      if (this.onKeyDown && instance.invoke("onKeyDown", e, instance) === false)
         return;

      switch (e.keyCode) {
         case KeyCode.enter:
            let item = items[this.cursorChildIndex[this.state.cursor]];
            if (item)
               this.handleItemClick(e, item.instance);
            break;

         case KeyCode.down:
            if (this.state.cursor + 1 < this.cursorChildIndex.length) {
               this.moveCursor(this.state.cursor + 1, {
                  focused: true,
                  scrollIntoView: true,
                  select: e.shiftKey,
                  selectRange: true
               });
               e.stopPropagation();
               e.preventDefault();
            }
            break;

         case KeyCode.up:
            if (this.state.cursor > 0) {
               this.moveCursor(this.state.cursor - 1, {
                  focused: true,
                  scrollIntoView: true,
                  select: e.shiftKey,
                  selectRange: true
               });
               e.stopPropagation();
               e.preventDefault();
            }
            break;
      }
   }
}
