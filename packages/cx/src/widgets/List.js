import { Widget, VDOM, getContent } from "../ui/Widget";
import { PureContainer } from "../ui/PureContainer";
import { GroupAdapter } from "../ui/adapter/GroupAdapter";
import { Binding, isBinding } from "../data/Binding";
import { Selection } from "../ui/selection/Selection";
import { KeyCode } from "../util/KeyCode";
import { scrollElementIntoView } from "../util/scrollElementIntoView";
import { FocusManager, oneFocusOut, offFocusOut, preventFocusOnTouch } from "../ui/FocusManager";
import { isString } from "../util/isString";
import { isArray } from "../util/isArray";
import { getAccessor } from "../data/getAccessor";
import { Container } from "../ui";

/*
 - renders list of items
 - focusable (keyboard navigation)
 - selection
 - fake focus - list appears focused and receives keyboard inputs redirected from other control (dropdown scenario)
 */

export class List extends Widget {
   init() {
      if (this.recordAlias) this.recordName = this.recordAlias;

      if (this.indexAlias) this.indexName = this.indexAlias;

      this.adapter = GroupAdapter.create(this.adapter || GroupAdapter, {
         recordName: this.recordName,
         indexName: this.indexName,
         recordsAccessor: getAccessor(this.records),
         keyField: this.keyField,
         sortOptions: this.sortOptions,
      });

      this.child = ListItem.create({
         layout: this.layout,
         items: this.items,
         children: this.children,
         styled: true,
         class: this.itemClass,
         className: this.itemClassName,
         style: this.itemStyle,
         disabled: this.itemDisabled,
         ...this.item,
      });

      delete this.children;

      this.selection = Selection.create(this.selection, {
         records: this.records,
      });

      super.init();

      if (this.grouping) {
         this.groupBy(this.grouping);
      }
   }

   initInstance(context, instance) {
      this.adapter.initInstance(context, instance);
   }

   declareData() {
      let selection = this.selection.configureWidget(this);

      super.declareData(
         selection,
         {
            records: undefined,
            sorters: undefined,
            sortField: undefined,
            sortDirection: undefined,
            filterParams: {
               structured: true,
            },
            itemStyle: {
               structured: true,
            },
            emptyText: undefined,
            tabIndex: undefined,
         },
         ...arguments
      );
   }

   prepareData(context, instance) {
      let { data } = instance;

      if (data.sortField)
         data.sorters = [
            {
               field: data.sortField,
               direction: data.sortDirection || "ASC",
            },
         ];
      this.adapter.sort(data.sorters);

      let filter = null;
      if (this.onCreateFilter) filter = instance.invoke("onCreateFilter", data.filterParams, instance);
      else if (this.filter) filter = (item) => this.filter(item, data.filterParams);
      this.adapter.setFilter(filter);
      instance.mappedRecords = this.adapter.getRecords(context, instance, data.records, instance.store);

      data.stateMods = Object.assign(data.stateMods || {}, {
         selectable: !this.selection.isDummy || this.onItemClick,
         empty: instance.mappedRecords.length == 0,
      });

      super.prepareData(context, instance);
   }

   explore(context, instance, data) {
      let instances = [];
      let isSelected = this.selection.getIsSelectedDelegate(instance.store);
      instance.mappedRecords.forEach((record) => {
         if (record.type == "data") {
            let itemInstance = instance.getChild(context, this.child, record.key, record.store);
            itemInstance.record = record;
            itemInstance.selected = isSelected(record.data, record.index);

            let changed = false;
            if (itemInstance.cache("recordData", record.data)) changed = true;
            if (itemInstance.cache("selected", itemInstance.selected)) changed = true;

            if (this.cached && !changed && itemInstance.visible && !itemInstance.childStateDirty) {
               instances.push(itemInstance);
               itemInstance.shouldUpdate = false;
            } else if (itemInstance.scheduleExploreIfVisible(context)) instances.push(itemInstance);
         } else if (record.type == "group-header" && record.grouping.header) {
            let itemInstance = instance.getChild(context, record.grouping.header, record.key, record.store);
            itemInstance.record = record;
            if (itemInstance.scheduleExploreIfVisible(context)) instances.push(itemInstance);
         } else if (record.type == "group-footer" && record.grouping.footer) {
            let itemInstance = instance.getChild(context, record.grouping.footer, record.key, record.store);
            itemInstance.record = record;
            if (itemInstance.scheduleExploreIfVisible(context)) instances.push(itemInstance);
         }
      });
      instance.instances = instances;
   }

   render(context, instance, key) {
      let items = instance.instances.map((x, i) => ({
         instance: x,
         key: x.record.key,
         type: x.record.type,
         content: getContent(x.render(context)),
      }));
      return (
         <ListComponent
            key={key}
            instance={instance}
            items={items}
            selectable={!this.selection.isDummy || this.onItemClick}
         />
      );
   }

   groupBy(grouping) {
      if (grouping) {
         if (!isArray(grouping)) {
            if (isString(grouping) || typeof grouping == "object") return this.groupBy([grouping]);
            throw new Error("DynamicGrouping should be an array of grouping objects");
         }

         grouping = grouping.map((g, i) => {
            if (isString(g)) {
               return {
                  key: {
                     [g]: {
                        bind: this.recordName + "." + g,
                     },
                  },
               };
            }
            return g;
         });
      }

      grouping.forEach((g) => {
         if (g.header) g.header = Widget.create(g.header);

         if (g.footer) g.footer = Widget.create(g.footer);
      });

      this.adapter.groupBy(grouping);
      this.update();
   }
}

List.prototype.recordName = "$record";
List.prototype.indexName = "$index";
List.prototype.baseClass = "list";
List.prototype.focusable = true;
List.prototype.focused = false;
List.prototype.itemPad = true;
List.prototype.cached = false;
List.prototype.styled = true;
List.prototype.scrollSelectionIntoView = false;
List.prototype.selectMode = false;

Widget.alias("list", List);

class ListComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      let { widget } = props.instance;
      let { focused } = widget;
      this.state = {
         cursor: focused && props.selectable ? 0 : -1,
         focused: focused,
      };

      this.handleItemMouseDown = this.handleItemMouseDown.bind(this);
      this.handleItemDoubleClick = this.handleItemDoubleClick.bind(this);
      this.handleItemClick = this.handleItemClick.bind(this);
   }

   shouldComponentUpdate(props, state) {
      return props.instance.shouldUpdate || state != this.state;
   }

   componentDidMount() {
      let { instance } = this.props;
      let { widget } = instance;
      if (widget.pipeKeyDown) {
         instance.invoke("pipeKeyDown", this.handleKeyDown.bind(this), instance);
         this.showCursor();
      }

      if (widget.autoFocus) FocusManager.focus(this.el);

      this.componentDidUpdate();
   }

   UNSAFE_componentWillReceiveProps(props) {
      this.setState({
         cursor: Math.max(Math.min(this.state.cursor, props.items.length - 1), this.state.focused ? 0 : -1),
      });
   }

   componentWillUnmount() {
      let { instance } = this.props;
      let { widget } = instance;
      offFocusOut(this);
      if (widget.pipeKeyDown) instance.invoke("pipeKeyDown", null, instance);
   }

   handleItemMouseDown(e) {
      let index = Number(e.currentTarget.dataset.recordIndex);
      this.moveCursor(index);
      if (e.shiftKey) e.preventDefault();

      this.moveCursor(index, {
         select: true,
         selectOptions: {
            toggle: e.ctrlKey,
         },
         selectRange: e.shiftKey,
      });
   }

   handleItemClick(e) {
      let { instance, items } = this.props;
      let index = Number(e.currentTarget.dataset.recordIndex);
      let item = items[this.cursorChildIndex[index]];
      if (instance.invoke("onItemClick", e, item.instance) === false) return;

      this.moveCursor(index, {
         select: true,
         selectOptions: {
            toggle: e.ctrlKey,
         },
         selectRange: e.shiftKey,
      });
   }

   handleItemDoubleClick(e) {
      let { instance, items } = this.props;
      let index = Number(e.currentTarget.dataset.recordIndex);
      let item = items[this.cursorChildIndex[index]];
      instance.invoke("onItemDoubleClick", e, item.instance);
   }

   render() {
      let { instance, items, selectable } = this.props;
      let { data, widget } = instance;
      let { CSS, baseClass } = widget;
      let itemStyle = CSS.parseStyle(data.itemStyle);
      this.cursorChildIndex = [];
      let cursorIndex = 0;

      let onDblClick, onClick;

      if (widget.onItemClick) onClick = this.handleItemClick;

      if (widget.onItemDoubleClick) onDblClick = this.handleItemDoubleClick;

      let children =
         items.length > 0 &&
         items.map((x, i) => {
            let { data, selected } = x.instance;
            let className;

            if (x.type == "data") {
               let ind = cursorIndex++;

               this.cursorChildIndex.push(i);
               className = CSS.element(baseClass, "item", {
                  selected: selected,
                  cursor: ind == this.state.cursor,
                  pad: widget.itemPad,
                  disabled: data.disabled,
               });

               return (
                  <li
                     key={x.key}
                     className={CSS.expand(className, data.classNames)}
                     style={itemStyle}
                     data-record-index={ind}
                     onMouseDown={this.handleItemMouseDown}
                     onClick={onClick}
                     onDoubleClick={onDblClick}
                  >
                     {x.content}
                  </li>
               );
            } else {
               return (
                  <li key={x.key} className={CSS.element(baseClass, x.type)}>
                     {x.content}
                  </li>
               );
            }
         });

      if (!children && data.emptyText) {
         children = <li className={CSS.element(baseClass, "empty-text")}>{data.emptyText}</li>;
      }

      return (
         <ul
            ref={(el) => {
               this.el = el;
            }}
            className={CSS.expand(data.classNames, CSS.state({ focused: this.state.focused }))}
            style={data.style}
            tabIndex={widget.focusable && selectable && items.length > 0 ? data.tabIndex || 0 : null}
            onMouseDown={preventFocusOnTouch}
            onKeyDown={this.handleKeyDown.bind(this)}
            onMouseLeave={this.handleMouseLeave.bind(this)}
            onFocus={this.onFocus.bind(this)}
            onBlur={this.onBlur.bind(this)}
         >
            {children}
         </ul>
      );
   }

   componentDidUpdate() {
      let { widget } = this.props.instance;
      if (widget.scrollSelectionIntoView) {
         //The timeout is reqired for use-cases when parent needs to do some measuring that affect scrollbars, i.e. LookupField.
         setTimeout(() => this.scrollElementIntoView(), 0);
      }
   }

   scrollElementIntoView() {
      if (!this.el) return; //unmount
      let { widget } = this.props.instance;
      let { CSS, baseClass } = widget;
      let selectedRowSelector = `.${CSS.element(baseClass, "item")}.${CSS.state("selected")}`;
      let firstSelectedRow = this.el.querySelector(selectedRowSelector);
      if (firstSelectedRow != this.selectedEl) {
         if (firstSelectedRow) scrollElementIntoView(firstSelectedRow);
         this.selectedEl = firstSelectedRow;
      }
   }

   moveCursor(index, { focused, hover, scrollIntoView, select, selectRange, selectOptions } = {}) {
      let { instance, selectable } = this.props;
      if (!selectable) return;

      let { widget } = instance;
      let newState = {};
      if (widget.focused) focused = true;

      if (focused != null && this.state.focused != focused) newState.focused = focused;

      //ignore mouse enter/leave events (support with a flag if a feature request comes)
      if (!hover) newState.cursor = index;

      if (select || widget.selectMode) {
         let start = selectRange && this.state.selectionStart >= 0 ? this.state.selectionStart : index;
         if (start < 0) start = index;
         this.selectRange(start, index, selectOptions);
         if (!selectRange) newState.selectionStart = index;
      }

      if (Object.keys(newState).length > 0) {
         this.setState(newState, () => {
            if (scrollIntoView) {
               let item = this.el.children[this.cursorChildIndex[index]];
               if (item) scrollElementIntoView(item);
            }
         });
      }
   }

   selectRange(from, to, options) {
      let { instance, items } = this.props;
      let { widget } = instance;

      if (from > to) {
         let tmp = from;
         from = to;
         to = tmp;
      }

      let selection = [],
         indexes = [];

      for (let cursor = from; cursor <= to; cursor++) {
         let item = items[this.cursorChildIndex[cursor]];
         if (item) {
            let { record, data } = item.instance;
            if (data.disabled) continue;
            selection.push(record.data);
            indexes.push(record.index);
         }
      }

      widget.selection.selectMultiple(instance.store, selection, indexes, options);
   }

   showCursor(focused) {
      if (this.state.cursor == -1) {
         let index = -1,
            firstSelected = -1,
            firstValid = -1;
         for (let i = 0; i < this.props.items.length; i++) {
            let item = this.props.items[i];
            if (isItemSelectable(item)) {
               index++;
               if (firstValid == -1) firstValid = index;
               if (item.instance.selected) {
                  firstSelected = index;
                  break;
               }
            }
         }
         this.moveCursor(firstSelected != -1 ? firstSelected : firstValid, {
            focused: true,
         });
      }
   }

   onFocus() {
      FocusManager.nudge();
      this.showCursor(true);

      let { widget } = this.props.instance;
      if (!widget.focused)
         oneFocusOut(this, this.el, () => {
            this.moveCursor(-1, { focused: false });
         });

      this.setState({
         focused: true,
      });
   }

   onBlur() {
      FocusManager.nudge();
   }

   handleMouseLeave() {
      let { widget } = this.props.instance;
      if (!widget.focused) this.moveCursor(-1, { hover: true });
   }

   handleKeyDown(e) {
      let { instance, items } = this.props;
      let { widget } = instance;

      if (this.onKeyDown && instance.invoke("onKeyDown", e, instance) === false) return;

      switch (e.keyCode) {
         case KeyCode.enter:
            let item = items[this.cursorChildIndex[this.state.cursor]];
            if (item && widget.onItemClick && instance.invoke("onItemClick", e, item.instance) === false) return;
            this.moveCursor(this.state.cursor, {
               select: true,
               selectOptions: {
                  toggle: e.ctrlKey,
               },
               selectRange: e.shiftKey,
            });
            break;

         case KeyCode.down:
            for (let index = this.state.cursor + 1; index < this.cursorChildIndex.length; index++) {
               let item = items[this.cursorChildIndex[index]];
               if (!isItemSelectable(item)) continue;
               this.moveCursor(index, {
                  focused: true,
                  scrollIntoView: true,
                  select: e.shiftKey,
                  selectRange: true,
               });
               e.stopPropagation();
               e.preventDefault();
               break;
            }
            break;

         case KeyCode.up:
            for (let index = this.state.cursor - 1; index >= 0; index--) {
               let item = items[this.cursorChildIndex[index]];
               if (!isItemSelectable(item)) continue;
               this.moveCursor(index, {
                  focused: true,
                  scrollIntoView: true,
                  select: e.shiftKey,
                  selectRange: true,
               });
               e.stopPropagation();
               e.preventDefault();
               break;
            }
            break;

         case KeyCode.a:
            if (!e.ctrlKey || !widget.selection.multiple) return;

            this.selectRange(0, this.cursorChildIndex.length);

            e.stopPropagation();
            e.preventDefault();
            break;
      }
   }
}

class ListItem extends Container {
   declareData(...args) {
      super.declareData(...args, {
         disabled: undefined,
      });
   }
}

function isItemSelectable(item) {
   return item && item.type == "data" && !item.instance.data.disabled;
}
