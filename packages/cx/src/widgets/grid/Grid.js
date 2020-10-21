import { Widget, VDOM, getContent } from "../../ui/Widget";
import { PureContainer } from "../../ui/PureContainer";
import { getSelector } from "../../data/getSelector";
import { isSelector } from "../../data/isSelector";
import { Format } from "../../ui/Format";
import { Selection } from "../../ui/selection/Selection";
import { DataAdapter } from "../../ui/adapter/DataAdapter";
import { GroupAdapter } from "../../ui/adapter/GroupAdapter";
import { ResizeManager } from "../../ui/ResizeManager";
import { KeyCode } from "../../util/KeyCode";
import { scrollElementIntoView } from "../../util/scrollElementIntoView";
import { findScrollableParent } from "../../util/findScrollableParent";
import { FocusManager, oneFocusOut, offFocusOut } from "../../ui/FocusManager";
import DropDownIcon from "../icons/sort-asc";
import { initiateDragDrop, registerDropZone } from "../drag-drop/ops";
import { GridRow, GridRowComponent } from "./GridRow";
import { Localization } from "../../ui/Localization";
import { SubscriberList } from "../../util/SubscriberList";
import { RenderingContext } from "../../ui/RenderingContext";
import { isNonEmptyArray } from "../../util/isNonEmptyArray";
import { isObject } from "../../util/isObject";
import { isString } from "../../util/isString";
import { isDefined } from "../../util/isDefined";
import { isArray } from "../../util/isArray";
import { isNumber } from "../../util/isNumber";
import { debounce } from "../../util/debounce";
import { shallowEquals } from "../../util/shallowEquals";
import { InstanceCache } from "../../ui/Instance";
import { Cx } from "../../ui/Cx";
import { Console } from "../../util/Console";
import { getTopLevelBoundingClientRect } from "../../util/getTopLevelBoundingClientRect";
import { getParentFrameBoundingClientRect } from "../../util/getParentFrameBoundingClientRect";
import { ValidationGroup } from "../form/ValidationGroup";
import { closest } from "../../util/DOM";
import { captureMouse2, getCursorPos } from "../overlay/captureMouse";
import { getAccessor } from "../../data/getAccessor";
import { getActiveElement } from "../../util/getActiveElement";
import { GridCellEditor } from "./GridCellEditor";

export class Grid extends Widget {
   declareData(...args) {
      let selection = this.selection.configureWidget(this);

      super.declareData(
         ...args,
         {
            records: undefined,
            sorters: undefined,
            preSorters: undefined,
            scrollable: undefined,
            sortField: undefined,
            sortDirection: undefined,
            emptyText: undefined,
            dragSource: { structured: true },
            dropZone: { structured: true },
            filterParams: { structured: true },
            groupingParams: { structured: true },
            scrollResetParams: { structured: true },
            page: undefined,
            totalRecordCount: undefined,
            tabIndex: undefined,
         },
         selection
      );
   }

   init() {
      if (this.recordAlias) this.recordName = this.recordAlias;

      if (this.indexAlias) this.indexName = this.indexAlias;

      if (this.infinite) {
         this.buffered = true;
         this.remoteSort = true;
      }

      if (this.buffered) this.scrollable = true;

      if (!this.scrollable) {
         this.fixedFooter = false; //unsupported combination
      }

      this.recordsAccessor = getAccessor(this.records);

      if (!this.row) this.row = {};

      if (this.columns)
         this.row.line1 = {
            columns: this.columns,
         };

      this.hasSortableColumns = false;
      this.hasResizableColumns = false;
      let aggregates = {};
      let lines = [];
      for (let i = 0; i < 10; i++) {
         let l = this.row["line" + i];
         if (l) {
            if (isArray(l.columns))
               for (let c = 0; c < l.columns.length; c++) l.columns[c].uniqueColumnId = `l${i}-${c}`;
            lines.push(l);
         }
      }

      this.header = PureContainer.create({
         items: GridColumnHeaderLine.create(lines),
      });

      this.header.items.forEach((line) => {
         line.items.forEach((c) => {
            if (c.sortable) this.hasSortableColumns = true;

            if (
               c.resizable ||
               (c.header && c.header.resizable) ||
               (c.header1 && c.header1.resizable) ||
               (c.header2 && c.header2.resizable) ||
               (c.header3 && c.header3.resizable)
            )
               this.hasResizableColumns = true;

            if (c.aggregate && (c.aggregateField || isDefined(c.aggregateValue))) {
               aggregates[c.aggregateAlias] = {
                  value: isDefined(c.aggregateValue)
                     ? c.aggregateValue
                     : isDefined(c.value)
                        ? c.value
                        : c.aggregateField
                           ? { bind: this.recordName + "." + c.aggregateField }
                           : null,
                  weight:
                     c.weight != null
                        ? c.weight
                        : c.weightField && {
                           bind: this.recordName + "." + c.weightField,
                        },
                  type: c.aggregate,
               };
            }
         });
      });

      //add default footer if some columns have aggregates and grouping is not defined
      if (!this.grouping && (Object.keys(aggregates).length > 0 || this.fixedFooter))
         this.grouping = [
            {
               key: {},
               showFooter: true,
            },
         ];

      if (this.fixedFooter && isNonEmptyArray(this.grouping)) {
         this.grouping[0].showFooter = true;
         if (this.grouping[0].key && Object.keys(this.grouping[0].key).length > 0)
            Console.warn(
               "First grouping level in grids with a fixed footer must group all data. The key field should be omitted."
            );
      }

      this.dataAdapter = DataAdapter.create(
         {
            type: (this.dataAdapter && this.dataAdapter.type) || GroupAdapter,
            recordsAccessor: this.recordsAccessor,
            keyField: this.keyField,
            aggregates: aggregates,
            recordName: this.recordName,
            indexName: this.indexName,
            sortOptions: this.sortOptions,
         },
         this.dataAdapter
      );

      this.selection = Selection.create(this.selection, {
         records: this.records,
      });

      if (!this.selection.isDummy || this.onRowClick || this.onRowDoubleClick) this.selectable = true;
      if (this.focusable == null)
         this.focusable = !this.selection.isDummy || this.cellEditable;

      super.init();

      this.row = Widget.create(GridRow, {
         class: this.CSS.element(this.baseClass, "data"),
         className: this.rowClass,
         style: this.rowStyle,
         recordName: this.recordName,
         hoverId: this.rowHoverId,
         ...this.row,
      });

      if (this.grouping) {
         this.groupBy(this.grouping);
      }
   }

   initState(context, instance) {
      instance.state = {
         colWidth: {},
         lockedColWidth: {},
         dimensionsVersion: 0,
      };
      instance.v = 0;
      if (this.infinite)
         instance.buffer = {
            records: [],
            totalRecordCount: 0,
            page: 1,
         };
   }

   prepareData(context, instance) {
      let { data, state, cached } = instance;

      data.version = ++instance.v;

      if (!this.infinite) data.totalRecordCount = isArray(data.records) ? data.records.length : 0;
      else {
         if (isNumber(data.totalRecordCount)) instance.buffer.totalRecordCount = data.totalRecordCount;
         else data.totalRecordCount = instance.buffer.totalRecordCount;

         if (isDefined(data.records)) instance.buffer.records = data.records;
         else data.records = instance.buffer.records;

         if (isNumber(data.page)) instance.buffer.page = data.page;
         else data.page = instance.buffer.page;

         data.offset = (data.page - 1) * this.pageSize;
      }

      if (!isArray(data.records)) data.records = [];

      if (state.sorters && !isDefined(this.sorters)) data.sorters = state.sorters;

      let sortField = null;

      if (isDefined(this.sortField) && isDefined(this.sortDirection)) {
         let sorter = {
            field: data.sortField,
            direction: data.sortDirection,
         };
         sortField = data.sortField;
         data.sorters = [sorter];
      }

      if (!isNonEmptyArray(data.sorters) && this.defaultSortField) {
         let sorter = {
            field: this.defaultSortField,
            direction: this.defaultSortDirection || "ASC",
         };
         sortField = this.defaultSortField;
         data.sorters = [sorter];
      }

      if (sortField) {
         for (let l = 1; l < 10; l++) {
            let line = this.row[`line${l}`];
            let sortColumn = line && line.columns && line.columns.find((c) => c.field == sortField);
            if (sortColumn && (sortColumn.sortValue || sortColumn.value)) {
               data.sorters[0].value = sortColumn.sortValue || sortColumn.value;
               break;
            }
         }
      }

      let headerMode = this.headerMode;

      if (this.headerMode == null) {
         if (this.scrollable || this.hasSortableColumns || this.hasResizableColumns) headerMode = "default";
         else headerMode = "plain";
      }

      let border = this.border;

      if (this.showBorder || (border == null && this.scrollable)) border = true;

      let dragMode = false;
      if (data.dragSource) dragMode = data.dragSource.mode || "move";

      let dropMode = data.dropZone && data.dropZone.mode;

      if (this.onDrop && !dropMode) dropMode = "preview";

      data.dropMode = dropMode;

      data.stateMods = {
         selectable: this.selectable,
         "cell-editable": this.cellEditable,
         scrollable: data.scrollable,
         buffered: this.buffered,
         ["header-" + headerMode]: true,
         border: border,
         vlines: this.vlines,
         ["drag-" + dragMode]: dragMode,
         ["drop-" + dropMode]: dropMode,
         resizable: this.hasResizableColumns,
      };

      super.prepareData(context, instance);

      if (this.onGetGrouping && (!cached.data || cached.data.groupingParams !== data.groupingParams)) {
         let grouping = instance.invoke("onGetGrouping", data.groupingParams, instance);
         this.groupBy(grouping, { autoConfigure: true });
      }

      instance.records = this.mapRecords(context, instance);

      //tree adapters can have additional (child) records, filtering also affects actual record count
      if (instance.records && !this.infinite) {
         //apply record count after filtering
         data.totalRecordCount = instance.records.length;

         //recheck if there are any actual records
         //when grouping is enabled group header/footer are always in
         if (instance.records.length < 5) {
            data.empty = true;
            for (let i = 0; i < instance.records.length; i++)
               if (instance.records[i].type == "data") {
                  data.empty = false;
                  break;
               }
         } else data.empty = data.totalRecordCount == 0;
      } else data.empty = data.totalRecordCount == 0;

      if (this.onCreateIsRecordSelectable) {
         instance.isRecordSelectable = instance.invoke("onCreateIsRecordSelectable", null, instance);
      }
   }

   initInstance(context, instance) {
      instance.fixedHeaderResizeEvent = new SubscriberList();
      this.dataAdapter.initInstance(context, instance);
      super.initInstance(context, instance);
   }

   initComponents(context, instance) {
      return super.initComponents(...arguments, {
         header: this.header,
      });
   }

   explore(context, instance) {
      context.push("parentPositionChangeEvent", instance.fixedHeaderResizeEvent);

      instance.hoverSync = context.hoverSync;

      super.explore(context, instance);

      let { store } = instance;
      instance.isSelected = this.selection.getIsSelectedDelegate(store);

      //do not process rows in buffered mode or cached mode if nothing has changed;
      if (!this.buffered && (!this.cached || instance.shouldUpdate)) {
         for (let i = 0; i < instance.records.length; i++) {
            let record = instance.records[i];
            if (record.type == "data") {
               let row = (record.row = instance.getChild(context, this.row, record.key, record.store));
               row.selected = instance.isSelected(record.data, record.index);
               let changed = false;
               if (row.cache("selected", row.selected)) changed = true;
               if (row.cache("recordData", record.data)) changed = true;
               if (this.cached && !changed && !row.childStateDirty) row.shouldUpdate = false;
               else row.scheduleExploreIfVisible(context);
            }
         }
      }
   }

   exploreCleanup(context, instance) {
      context.pop("parentPositionChangeEvent");
      let fixedColumnCount = 0,
         visibleColumns = [];
      instance.components.header.children.forEach((line) => {
         line.children.forEach((col) => {
            if (col.data.fixed) fixedColumnCount++;
            visibleColumns.push(col.widget);
         });
      });
      instance.visibleColumns = visibleColumns;
      instance.hasFixedColumns = fixedColumnCount > 0;
      instance.fixedColumnCount = fixedColumnCount;
      if (fixedColumnCount > 0) {
         instance.data.classNames += ` ${instance.widget.CSS.state("fixed-columns")}`;
      }
   }

   applyGrouping(grouping, { autoConfigure } = {}) {
      if (grouping) {
         if (!isArray(grouping)) {
            if (isString(grouping) || isObject(grouping)) return this.groupBy([grouping]);
            throw new Error("DynamicGrouping should be an array or grouping objects");
         }

         grouping = grouping.map((g, i) => {
            if (isString(g)) {
               return {
                  key: {
                     [g]: {
                        bind: this.recordName + "." + g,
                     },
                  },
                  showHeader: !this.scrollable && i == grouping.length - 1,
                  showFooter: true,
                  caption: { bind: `$group.${g}` },
                  text: { bind: `${this.recordName}.${g}` },
               };
            }
            return g;
         });

         initGrouping(grouping);
      }

      if (autoConfigure) this.showHeader = !isArray(grouping) || !grouping.some((g) => g.showHeader);

      if (!this.dataAdapter.groupBy) {
         Console.warn("Configured grid data adapter does not support grouping. Grouping instructions are ignored.");
         return;
      }

      this.dataAdapter.groupBy(grouping);
   }

   groupBy(grouping, options) {
      this.applyGrouping(grouping, options);
      this.update();
   }

   render(context, instance, key) {
      let { data, hasFixedColumns } = instance;

      let fixedHeader =
         data.scrollable && this.showHeader && this.renderHeader(context, instance, "header", true, false);

      let fixedColumnsFixedHeader =
         data.scrollable &&
         this.showHeader &&
         hasFixedColumns &&
         this.renderHeader(context, instance, "header", true, true);

      if (!this.buffered) this.renderRows(context, instance);

      if (this.fixedFooter) this.renderFixedFooter(context, instance);

      let header = this.showHeader && this.renderHeader(context, instance, "header", false, false);

      let fixedColumnsHeader =
         this.showHeader && hasFixedColumns && this.renderHeader(context, instance, "header", false, true);

      return (
         <GridComponent
            key={key}
            instance={instance}
            data={instance.data}
            shouldUpdate={instance.shouldUpdate}
            header={header}
            fixedColumnsHeader={fixedColumnsHeader}
            fixedColumnsFixedHeader={fixedColumnsFixedHeader}
            fixedHeader={fixedHeader}
            fixedFooter={instance.fixedFooterVDOM}
            fixedColumnsFixedFooter={instance.fixedColumnsFixedFooterVDOM}
         />
      );
   }

   renderHeader(context, instance, key, fixed, fixedColumns) {
      let { data, widget, components } = instance;
      let { header } = components;

      let { CSS, baseClass } = widget;

      let headerRows = [];

      if (!header) return null;

      let skip = {};

      header.children.forEach((line, lineIndex) => {
         let empty = [true, true, true];
         let result = [[], [], []];

         line.children.forEach((hdinst, colIndex) => {
            let hdwidget = hdinst.widget;
            for (let l = 0; l < 3; l++) {
               let colKey = `${lineIndex}-${colIndex}-${l}`;

               if (skip[colKey]) continue;

               if (Boolean(hdinst.data.fixed) != fixedColumns) continue;

               let header = hdinst.components[`header${l + 1}`];
               let colSpan,
                  rowSpan,
                  style,
                  cls,
                  mods = [],
                  content,
                  sortIcon,
                  tool;

               let resizer = null;

               if (header) {
                  empty[l] = false;

                  if (header.widget.align) mods.push("aligned-" + header.widget.align);
                  else if (hdwidget.align) mods.push("aligned-" + hdwidget.align);

                  if (hdwidget.sortable && header.widget.allowSorting) {
                     mods.push("sortable");

                     if (data.sorters && data.sorters[0].field == (hdwidget.sortField || hdwidget.field)) {
                        mods.push("sorted-" + data.sorters[0].direction.toLowerCase());
                        sortIcon = <DropDownIcon className={CSS.element(baseClass, "column-sort-icon")} />;
                     }
                  }

                  style = header.data.style;
                  let customWidth =
                     header.data.width ||
                     instance.state.colWidth[hdwidget.uniqueColumnId] ||
                     header.data.defaultWidth ||
                     instance.state.lockedColWidth[hdwidget.uniqueColumnId];
                  if (customWidth) {
                     if (instance.state.colWidth[hdwidget.uniqueColumnId] != customWidth)
                        instance.state.colWidth[hdwidget.uniqueColumnId] = customWidth;
                     let s = `${customWidth}px`;
                     style = {
                        ...style,
                        width: s,
                        minWidth: s,
                        maxWidth: s,
                     };
                  }

                  if (header.data.classNames) cls = header.data.classNames;

                  content = header.render(context);

                  if (header.components && header.components.tool) {
                     tool = (
                        <div className={CSS.element(baseClass, "col-header-tool")}>
                           {getContent(header.components.tool.render(context))}
                        </div>
                     );
                     mods.push("tool");
                  }

                  if (header.data.colSpan > 1 || header.data.rowSpan > 1) {
                     colSpan = header.data.colSpan;
                     rowSpan = header.data.rowSpan;

                     for (let r = 0; r < header.data.rowSpan; r++)
                        for (let c = 0; c < header.data.colSpan; c++)
                           skip[`${lineIndex}-${colIndex + c}-${l + r}`] = true;
                  }

                  if (hdwidget.resizable || header.data.resizable) {
                     resizer = (
                        <div
                           className={CSS.element(baseClass, "col-resizer")}
                           onClick={(e) => {
                              e.stopPropagation();
                           }}
                           onMouseDown={(e) => {
                              if (e.buttons != 1) return;
                              let resizeOverlayEl = document.createElement("div");
                              let headerCell = e.target.parentElement;
                              let scrollAreaEl = headerCell.parentElement.parentElement.parentElement.parentElement;
                              let gridEl = scrollAreaEl.parentElement;
                              let initialWidth = headerCell.offsetWidth;
                              let initialPosition = getCursorPos(e);
                              resizeOverlayEl.className = CSS.element(baseClass, "resize-overlay");
                              resizeOverlayEl.style.width = `${initialWidth}px`;
                              resizeOverlayEl.style.left = `${
                                 headerCell.getBoundingClientRect().left - gridEl.getBoundingClientRect().left
                                 }px`;
                              gridEl.appendChild(resizeOverlayEl);
                              captureMouse2(e, {
                                 onMouseMove: (e) => {
                                    let cursor = getCursorPos(e);
                                    let width = Math.max(
                                       30,
                                       Math.round(initialWidth + cursor.clientX - initialPosition.clientX)
                                    );
                                    resizeOverlayEl.style.width = `${width}px`;
                                 },
                                 onMouseUp: (e) => {
                                    if (!resizeOverlayEl) return; //dblclick
                                    let width = resizeOverlayEl.offsetWidth;
                                    hdinst.assignedWidth = width;
                                    gridEl.removeChild(resizeOverlayEl);
                                    resizeOverlayEl = null;
                                    if (widget.onColumnResize)
                                       instance.invoke("onColumnResize", { width, column: hdwidget }, hdinst);
                                    header.set("width", width);
                                    instance.setState({
                                       dimensionsVersion: instance.state.dimensionsVersion + 1,
                                       colWidth: {
                                          ...instance.state.colWidth,
                                          [hdwidget.uniqueColumnId]: width,
                                       },
                                    });
                                 },
                                 onDblClick: () => {
                                    let table = gridEl.querySelector("table");
                                    let parentEl = table.parentElement;
                                    let tableClone = table.cloneNode(true);
                                    tableClone.childNodes.forEach((tbody) => {
                                       tbody.childNodes.forEach((tr) => {
                                          tr.childNodes.forEach((td, index) => {
                                             if (index == colIndex) {
                                                td.style.maxWidth = null;
                                                td.style.minWidth = null;
                                                td.style.width = "auto";
                                             } else {
                                                td.style.display = "none";
                                             }
                                          });
                                       });
                                    });
                                    tableClone.style.position = "absolute";
                                    tableClone.style.visibility = "hidden";
                                    tableClone.style.top = 0;
                                    tableClone.style.left = 0;
                                    tableClone.style.width = "auto";
                                    parentEl.appendChild(tableClone);
                                    let width = tableClone.offsetWidth;
                                    parentEl.removeChild(tableClone);
                                    header.set("width", width);
                                    instance.setState({
                                       dimensionsVersion: instance.state.dimensionsVersion + 1,
                                       colWidth: {
                                          ...instance.state.colWidth,
                                          [hdwidget.uniqueColumnId]: width,
                                       },
                                    });
                                 },
                              });
                           }}
                        />
                     );
                  }
               }

               cls = CSS.element(baseClass, "col-header", mods) + (cls ? " " + cls : "");

               let onContextMenu;

               if (this.onColumnContextMenu) onContextMenu = (e) => instance.invoke("onColumnContextMenu", e, hdinst);

               result[l].push(
                  <th
                     key={colIndex}
                     colSpan={colSpan}
                     rowSpan={rowSpan}
                     className={cls}
                     style={style}
                     onClick={(e) => this.onHeaderClick(e, hdwidget, instance, l)}
                     onContextMenu={onContextMenu}
                     data-unique-col-id={hdwidget.uniqueColumnId}
                  >
                     {getContent(content)}
                     {sortIcon}
                     {tool}
                     {resizer}
                  </th>
               );
            }
         });

         result = result.filter((_, i) => !empty[i]);

         if (result[0]) {
            if (fixed && !fixedColumns) {
               result[0].push(
                  <th key="dummy" rowSpan={result.length} className={CSS.element(baseClass, "col-header")} />
               );
            }

            headerRows.push(
               <tbody key={"h" + key + lineIndex} className={CSS.element(baseClass, "header")}>
                  {result.map((h, i) => (
                     <tr key={i}>{h}</tr>
                  ))}
               </tbody>
            );
         }
      });

      if (headerRows.length == 0) return null;

      return headerRows;
   }

   onHeaderClick(e, column, instance, headerLine) {
      e.preventDefault();
      e.stopPropagation();

      let { data } = instance;
      let header = column.components[`header${headerLine + 1}`];

      let sortField = column.sortField || column.field;
      let sortValue = column.sortValue || column.value;
      if (header && header.allowSorting && column.sortable && (sortField || sortValue)) {
         let dir = "ASC";
         if (
            data.sorters &&
            (data.sorters[0].field == (sortField || data.sortField) || data.sorters[0].value == sortValue)
         ) {
            if (data.sorters[0].direction == "ASC") dir = "DESC";
            else if (this.clearableSort && data.sorters[0].direction == "DESC") dir = null;
         }

         let sorters = dir
            ? [
               {
                  field: sortField,
                  direction: dir,
                  value: sortValue,
               },
            ]
            : null;

         instance.set("sorters", sorters);
         instance.set("sortField", sortField);
         instance.set("sortDirection", dir);

         if (!this.remoteSort || this.infinite) instance.setState({ sorters });
      }
   }

   renderGroupHeader(context, instance, g, level, group, i, store) {
      let { CSS, baseClass } = this;
      let data = store.getData();
      if (g.caption) {
         let caption = g.caption(data);
         return (
            <tbody key={`g-${level}-${i}`} className={CSS.element(baseClass, "group-caption", ["level-" + level])}>
               <tr>
                  <td colSpan={1000}>{caption}</td>
               </tr>
            </tbody>
         );
      } else if (g.showCaption) {
         let skip = 0;

         let { header } = instance.components;

         let lines = [];
         header.children.forEach((line, lineIndex) => {
            let empty = true;

            let cells = line.children.map((ci, i) => {
               if (--skip >= 0) return null;

               let v,
                  c = ci.widget,
                  colSpan,
                  pad;
               if (c.caption) {
                  if (c.caption.children)
                     v = <Cx widget={c.caption.children} store={store} parentInstance={instance} />;
                  else v = c.caption.value(data);
                  pad = c.caption.pad;
                  colSpan = c.caption.colSpan;
                  empty = false;

                  if (c.caption.expand) {
                     colSpan = 1;
                     for (
                        let ind = i + 1;
                        ind < line.children.length &&
                        !line.children[ind].widget.caption &&
                        !line.children[ind].widget.aggregate;
                        ind++
                     )
                        colSpan++;
                  }

                  if (colSpan > 1) skip = colSpan - 1;
               } else if (c.aggregate && c.aggregateField && c.caption !== false) {
                  empty = false;
                  v = group[c.aggregateField];
                  if (isString(ci.data.format)) v = Format.value(v, ci.data.format);
               }

               let cls = "";
               if (c.align) cls += CSS.state("aligned-" + c.align);

               if (pad !== false) cls += (cls ? " " : "") + CSS.state("pad");

               return (
                  <td key={i} className={cls} colSpan={colSpan}>
                     {v}
                  </td>
               );
            });

            if (empty) return;

            lines.push(<tr key={lineIndex}>{cells}</tr>);
         });

         if (lines.length == 0) return null;

         return (
            <tbody key={"c" + i} className={CSS.element(baseClass, "group-caption", ["level-" + level])}>
               {lines}
            </tbody>
         );
      }
   }

   renderGroupFooter(context, instance, g, level, group, i, store, fixed, fixedColumns) {
      let { CSS, baseClass } = this;
      let data = store.getData();
      let skip = 0;

      let { header } = instance.components;
      let rowStyle = {};

      //hide the last group footer if fixedFooter is used
      //but leave it rendered for column size calculation
      if (
         this.fixedFooter &&
         !fixed &&
         isArray(this.dataAdapter.groupings) &&
         level == this.dataAdapter.groupings.length
      )
         rowStyle.visibility = "hidden";

      let lines = [];
      header.children.forEach((line, lineIndex) => {
         let empty = true;

         let cells = line.children.map((ci, i) => {
            if (--skip >= 0) return null;

            if (Boolean(ci.data.fixed) != fixedColumns) return null;

            let v,
               c = ci.widget,
               colSpan,
               pad;
            if (c.footer) {
               v = c.footer.value(data);
               pad = c.footer.pad;
               colSpan = c.footer.colSpan;
               empty = false;

               if (c.footer.expand) {
                  colSpan = 1;
                  for (
                     let ind = i + 1;
                     ind < line.children.length &&
                     !line.children[ind].widget.footer &&
                     !line.children[ind].widget.aggregate;
                     ind++
                  )
                     colSpan++;
               }

               if (colSpan > 1) skip = colSpan - 1;
            } else if (c.aggregate && c.aggregateField && c.footer !== false) {
               empty = false;
               v = group[c.aggregateField];
               if (isString(ci.data.format)) v = Format.value(v, ci.data.format);
            }

            let cls = "";
            if (c.align) cls += CSS.state("aligned-" + c.align);

            if (pad !== false) cls += (cls ? " " : "") + CSS.state("pad");

            return (
               <td key={i} className={cls} colSpan={colSpan}>
                  {v}
               </td>
            );
         });

         if (empty) return;

         if (fixed && !fixedColumns)
            cells.push(<td key="dummy" className={CSS.element(baseClass, "fixed-footer-corner")} />);

         lines.push(<tr key={lineIndex}>{cells}</tr>);
      });

      if (lines.length == 0) return null;

      return (
         <tbody key={"f" + i} style={rowStyle} className={CSS.element(baseClass, "group-footer", ["level-" + level])}>
            {lines}
         </tbody>
      );
   }

   renderRows(context, instance) {
      let { records, hasFixedColumns } = instance;

      if (!isArray(records)) return null;

      let record, g;

      for (let i = 0; i < records.length; i++) {
         record = records[i];
         if (record.type == "data") {
            record.vdom = record.row.render(context, record.key);
         }

         if (record.type == "group-header") {
            record.vdom = [];
            record.fixedVdom = [];
            g = record.grouping;
            if (g.caption || g.showCaption)
               record.vdom.push(
                  this.renderGroupHeader(
                     context,
                     instance,
                     g,
                     record.level,
                     record.group,
                     record.key + "-caption",
                     record.store
                  )
               );

            if (g.showHeader) {
               record.vdom.push(this.renderHeader(context, instance, record.key + "-header", false, false));
               if (hasFixedColumns)
                  record.fixedVdom.push(this.renderHeader(context, instance, record.key + "-header", false, true));
            }
         }

         if (record.type == "group-footer") {
            g = record.grouping;
            if (g.showFooter) {
               record.vdom = this.renderGroupFooter(
                  context,
                  instance,
                  g,
                  record.level,
                  record.group,
                  record.key + "-footer",
                  record.store,
                  false,
                  false
               );
               if (hasFixedColumns)
                  record.fixedVdom = this.renderGroupFooter(
                     context,
                     instance,
                     g,
                     record.level,
                     record.group,
                     record.key + "-footer",
                     record.store,
                     false,
                     true
                  );
            }
         }
      }
   }

   renderFixedFooter(context, instance) {
      let { records, hasFixedColumns, data } = instance;

      instance.fixedFooterVDOM = null;
      instance.fixedColumnsFixedFooterVDOM = null;

      if (data.empty || !isNonEmptyArray(records)) return;

      //all type of records are allowed here because the footer can be based on pre-computed data
      //it doesn't make sense to show the footer if the grid is empty though
      let record = records[records.length - 1];

      instance.fixedFooterOverlap = record.type == "group-footer";

      instance.fixedFooterVDOM = this.renderGroupFooter(
         context,
         instance,
         record.grouping,
         record.level,
         record.group,
         record.key + "-footer",
         record.store,
         true,
         false
      );

      if (hasFixedColumns)
         instance.fixedColumnsFixedFooterVDOM = this.renderGroupFooter(
            context,
            instance,
            record.grouping,
            record.level,
            record.group,
            record.key + "-footer",
            record.store,
            true,
            true
         );
   }

   mapRecords(context, instance) {
      let { data, store } = instance;

      let filter = null;
      if (this.onCreateFilter) filter = instance.invoke("onCreateFilter", data.filterParams, instance);

      let sorters = !this.remoteSort && data.sorters;

      //apply pre-sorters only if some sorting is applied
      if (isNonEmptyArray(data.sorters) && isNonEmptyArray(data.preSorters)) {
         sorters = [...data.preSorters, ...data.sorters];
      }

      this.dataAdapter.setFilter(filter);
      this.dataAdapter.sort(sorters);

      //if no filtering or sorting applied, let the component maps records on demand
      if (this.buffered && !this.fixedFooter && !filter && !isNonEmptyArray(sorters) && !this.dataAdapter.isTreeAdapter)
         return null;

      return this.dataAdapter.getRecords(context, instance, data.records, store);
   }

   mapRecord(context, instance, data, index) {
      return this.dataAdapter.mapRecord(context, instance, data, instance.store, this.recordsAccessor, index);
   }
}

Grid.prototype.baseClass = "grid";
Grid.prototype.showHeader = true;
Grid.prototype.showFooter = false;
Grid.prototype.recordName = "$record";
Grid.prototype.indexName = "$index";
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
Grid.prototype.pageSize = 100;
Grid.prototype.infinite = false;
Grid.prototype.styled = true;
Grid.prototype.scrollSelectionIntoView = false;
Grid.prototype.clearableSort = false;
Grid.prototype.cellEditable = false;
Grid.prototype.preciseMeasurements = false;
Grid.prototype.hoverChannel = "default";
Grid.prototype.focusable = null; // automatically resolved

Widget.alias("grid", Grid);
Localization.registerPrototype("cx/widgets/Grid", Grid);

class GridComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      this.dom = {};
      let { widget } = props.instance;

      let end = Math.min(widget.bufferSize, props.data.totalRecordCount);

      this.state = {
         cursor: widget.focused && widget.selectable ? 0 : -1,
         cursorCellIndex: 0,
         focused: widget.focused,
         dropInsertionIndex: null,
         start: 0,
         end: end,
      };

      this.syncBuffering = false;

      if (widget.infinite) {
         this.start = 0;
         this.end = end;
         this.loadingStartPage = 0;
         this.loadingEndPage = 0;
      }

      this.scrollerRef = (el) => {
         this.dom.scroller = el;
      };

      this.fixedScrollerRef = (el) => {
         this.dom.fixedScroller = el;
      };

      this.gridRef = (el) => {
         this.dom.el = el;
      };
   }

   getBufferStartEnd() {
      //{start, end};
      return this.syncBuffering ? this : this.state;
   }

   renderCellEditor(key, CSS, baseClass, instance, column) {
      //add an inner div with fixed height in order to help IE absolutely position the contents inside
      return (
         <td key={key} className={CSS.element(baseClass, "cell-editor")}>
            <Cx parentInstance={instance} subscribe>
               <GridCellEditor
                  className={CSS.element(baseClass, "cell-editor-wrap")}
                  style={
                     this.rowHeight > 0
                        ? {
                           height: this.rowHeight + 1,
                        }
                        : null
                  }
               >
                  <ValidationGroup
                     valid={{
                        get: () => this.cellEditorValid,
                        set: (value) => {
                           this.cellEditorValid = value;
                        },
                     }}
                  >
                     {column.editor}
                  </ValidationGroup>
               </GridCellEditor>
            </Cx>
         </td>
      );
   }

   createRowRenderer(cellWrap) {
      let { instance, data } = this.props;
      let { widget, isRecordSelectable, visibleColumns } = instance;
      let { CSS, baseClass } = widget;
      let { dragSource } = data;
      let { dragged, cursor, cursorCellIndex, cellEdit, dropInsertionIndex, dropTarget } = this.state;
      let { colWidth, dimensionsVersion } = instance.state;

      return (record, index, standalone, fixed) => {
         let { store, key, row } = record;
         let isDragged = dragged && (row.selected || record == dragged);
         let mod = {
            selected: row.selected,
            dragged: isDragged,
            draggable: dragSource && (!row.dragHandles || row.dragHandles.length == 0),
            cursor: widget.selectable && index == cursor,
            over: dropTarget == 'row' && dropInsertionIndex === index
         };

         if (isRecordSelectable) {
            let selectable = isRecordSelectable(record.data, {});
            mod["selectable"] = selectable;
            mod["non-selectable"] = !selectable;
         }

         let wrap = (children) => (
            <GridRowComponent
               key={key}
               className={CSS.state(mod)}
               store={store}
               dragSource={dragSource}
               instance={row}
               grid={instance}
               record={record}
               parent={this}
               cursorIndex={index}
               selected={row.selected}
               isBeingDragged={dragged}
               isDraggedOver={mod.over}
               cursor={mod.cursor}
               cursorCellIndex={index == cursor && cursorCellIndex}
               cellEdit={index == cursor && cursorCellIndex && cellEdit}
               shouldUpdate={row.shouldUpdate}
               dimensionsVersion={dimensionsVersion}
               fixed={fixed}
            >
               {children.content.map(({ key, data, content }, line) => (
                  <tr key={key} className={data.classNames} style={data.style}>
                     {content.map(({ key, data, content, uniqueColumnId }, cellIndex) => {
                        if (Boolean(data.fixed) !== fixed) return null;
                        let cellected =
                           index == cursor && cellIndex == cursorCellIndex && widget.cellEditable && line == 0;
                        let className = cellected
                           ? CSS.expand(data.classNames, CSS.state("cellected"))
                           : data.classNames;
                        if (cellected && cellEdit) {
                           let column = visibleColumns[cursorCellIndex];
                           if (column && column.editor && data.editable)
                              return this.renderCellEditor(key, CSS, baseClass, instance, column);
                        }
                        let width = colWidth[uniqueColumnId];
                        let style = data.style;
                        if (width) {
                           style = {
                              ...style,
                              maxWidth: `${width}px`,
                           };
                        }

                        if (cellWrap) content = cellWrap(content);

                        return (
                           <td
                              key={key}
                              className={className}
                              style={style}
                              colSpan={data.colSpan}
                              rowSpan={data.rowSpan}
                           >
                              {content}
                           </td>
                        );
                     })}
                  </tr>
               ))}
            </GridRowComponent>
         );

         if (!standalone) return wrap(record.vdom);

         return (
            <Cx
               key={key}
               instance={record.row}
               parentInstance={instance}
               options={{ name: "grid-row" }}
               contentFactory={(x) =>
                  wrap({
                     content: Array.isArray(x.children) ? x.children : x.children != null ? [x.children] : [],
                     data: {},
                  })
               }
               params={{
                  ...mod,
                  dimensionsVersion: dimensionsVersion,
                  cursorIndex: index,
                  data: record.data,
                  cursorCellIndex: index == cursor && cursorCellIndex,
                  cellEdit: index == cursor && cursorCellIndex && cellEdit,
               }}
            />
         );
      };
   }

   render() {
      let { instance, data, fixedFooter, fixedColumnsFixedFooter } = this.props;
      let { widget, hasFixedColumns, } = instance;
      let { CSS, baseClass } = widget;
      let { start, end } = this.getBufferStartEnd();

      let cellWrap = false;

      if (widget.cellEditable && (widget.hasResizableColumns || hasFixedColumns)) {
         cellWrap = (children) => <div className="cxe-grid-cell-clip">{children}</div>;
      }

      let children = [],
         fixedChildren = [];

      let renderRow = this.createRowRenderer(cellWrap);

      let addRow = (record, index, standalone) => {
         children.push(renderRow(record, index, standalone, false));
         if (hasFixedColumns) fixedChildren.push(renderRow(record, index, standalone, true));

         //avoid re-rendering on cursor change
         record.row.shouldUpdate = false;
      };

      if (widget.buffered) {
         let context = new RenderingContext();
         let dummyDataClass = CSS.element(baseClass, "data", { dummy: true });
         if (!instance.recordInstanceCache) instance.recordInstanceCache = new InstanceCache(instance);
         instance.recordInstanceCache.mark();
         this.getRecordsSlice(start, end).forEach((r, i) => {
            if (r == null) {
               addRow(
                  {
                     key: "dummy-" + start + i,
                     row: {
                        data: { classNames: dummyDataClass },
                        widget: widget.row,
                     },
                     vdom: {
                        content: [
                           {
                              key: 0,
                              data: {},
                              content: [
                                 {
                                    key: 0,
                                    data: {
                                       colSpan: 1000,
                                       style: {
                                          height: `${this.rowHeight}px`,
                                       },
                                    },
                                 },
                              ],
                           },
                        ],
                     },
                  },
                  start + i
               );
            } else {
               let record = instance.records
                  ? r
                  : widget.mapRecord(context, instance, r, widget.infinite ? start + i - data.offset : start + i);
               let row = (record.row = instance.recordInstanceCache.getChild(widget.row, record.store, record.key));
               instance.recordInstanceCache.addChild(row);
               row.detached = true;
               row.selected = instance.isSelected(record.data, record.index);

               if (record.type == "data") {
                  addRow(record, start + i, true);
               } else if (record.type == "group-header") {
                  let g = record.grouping;
                  if (g.caption || g.showCaption)
                     children.push(
                        widget.renderGroupHeader(
                           null,
                           instance,
                           g,
                           record.level,
                           record.group,
                           record.key + "-caption",
                           record.store
                        )
                     );
               } else if (record.type == "group-footer") {
                  let g = record.grouping;
                  if (g.showFooter && (!widget.fixedFooter || start + i != instance.records.length - 1))
                     children.push(
                        widget.renderGroupFooter(
                           null,
                           instance,
                           g,
                           record.level,
                           record.group,
                           record.key + "-footer",
                           record.store
                        )
                     );
               }
            }
         });
         instance.recordInstanceCache.sweep();
      } else {
         instance.records.forEach((record, i) => {
            if (record.type == "data") {
               addRow(record, i);
            } else {
               children.push(record.vdom);
               if (hasFixedColumns) fixedChildren.push(record.fixedVdom);
            }
         });
      }

      if (this.state.dropTarget == 'grid' && this.state.dropInsertionIndex != null) {
         let dragInsertionRow = (
            <tbody key="dropzone">
               <tr>
                  <td
                     className={CSS.element(baseClass, "dropzone")}
                     colSpan={1000}
                     style={{
                        height: data.dropMode == "insertion" ? 0 : this.state.dropItemHeight,
                     }}
                  ></td>
               </tr>
            </tbody>
         );
         children.splice(this.state.dropInsertionIndex, 0, dragInsertionRow);
      }

      let content = [],
         fixedColumnsContent = [];

      //instance.records holds the record count after filtering
      if (data.emptyText && data.empty) {
         children = [
            <tbody key="empty" className={CSS.element(baseClass, "empty-text")}>
               <tr>
                  <td colSpan={1000}>{data.emptyText}</td>
               </tr>
            </tbody>,
         ];
      }

      if (hasFixedColumns) {
         fixedColumnsContent.push(
            <div
               key="fixedscroller"
               ref={this.fixedScrollerRef}
               className={CSS.element(baseClass, "fixed-scroll-area", {
                  "fixed-header": !!this.props.header,
               })}
            >
               <div className={CSS.element(baseClass, "fixed-table-wrapper")}>
                  <table
                     ref={(el) => {
                        this.dom.fixedTable = el;
                     }}
                  >
                     {this.props.fixedColumnsHeader}
                     {fixedChildren}
                  </table>
               </div>
            </div>
         );
      }

      content.push(
         <div
            key="scroller"
            ref={this.scrollerRef}
            onScroll={this.onScroll.bind(this)}
            className={CSS.element(baseClass, "scroll-area", {
               "fixed-header": !!this.props.header,
            })}
         >
            <div className={CSS.element(baseClass, "table-wrapper")}>
               <table
                  ref={(el) => {
                     this.dom.table = el;
                  }}
               >
                  {this.props.header}
                  {children}
               </table>
            </div>
         </div>
      );

      if (this.props.fixedHeader)
         content.push(
            <div
               key="fh"
               ref={(el) => {
                  this.dom.fixedHeader = el;
               }}
               className={CSS.element(baseClass, "fixed-header")}
               style={{
                  display: this.scrollWidth > 0 ? "block" : "none",
               }}
            >
               <table>{this.props.fixedHeader}</table>
            </div>
         );

      if (this.props.fixedColumnsFixedHeader)
         fixedColumnsContent.push(
            <div
               key="fcfh"
               ref={(el) => {
                  this.dom.fixedColumnsFixedHeader = el;
               }}
               className={CSS.element(baseClass, "fixed-fixed-header")}
               style={{
                  display: this.scrollWidth > 0 ? "block" : "none",
               }}
            >
               <table>{this.props.fixedColumnsFixedHeader}</table>
            </div>
         );

      if (fixedFooter || fixedColumnsFixedFooter) {
         content.push(
            <div
               key="ff"
               ref={(el) => {
                  this.dom.fixedFooter = el;
               }}
               className={CSS.element(baseClass, "fixed-footer")}
               style={{
                  display: this.scrollWidth > 0 ? "block" : "none",
               }}
            >
               <table>{fixedFooter}</table>
            </div>
         );

         if (hasFixedColumns)
            fixedColumnsContent.push(
               <div
                  key="fcff"
                  ref={(el) => {
                     this.dom.fixedColumnsFixedFooter = el;
                  }}
                  className={CSS.element(baseClass, "fixed-fixed-footer")}
                  style={{
                     display: this.scrollWidth > 0 ? "block" : "none",
                  }}
               >
                  <table>{fixedColumnsFixedFooter}</table>
               </div>
            );
      }

      return (
         <div
            className={data.classNames}
            style={{ ...data.style, counterReset: `cx-row-number ${start}` }}
            tabIndex={widget.focusable ? data.tabIndex || 0 : null}
            ref={this.gridRef}
            onKeyDown={this.handleKeyDown.bind(this)}
            onFocus={this.onFocus.bind(this)}
            onBlur={this.onBlur.bind(this)}
         >
            {fixedColumnsContent}
            {content}
         </div>
      );
   }

   getRecordsSlice(start, end) {
      let { data, instance } = this.props;
      let { widget } = instance;
      if (!widget.infinite) {
         let source = instance.records || data.records;
         return source.slice(start, end);
      }

      let { offset, records } = data;
      let result = [];
      for (let i = start; i < Math.min(end, data.totalRecordCount); i++) {
         if (i >= offset && i < offset + records.length) result.push(records[i - offset]);
         else result.push(null);
      }

      return result;
   }

   ensureData(visibleStart, visibleEnd) {
      if (this.loading) return;

      let { instance } = this.props;
      let { widget } = instance;
      let { pageSize } = widget;

      let startPage = Math.trunc(visibleStart / pageSize) + 1,
         endPage = Math.trunc((visibleEnd - 1) / pageSize) + 1;

      //debouncing restricts excessive page loading on fast scrolling as rendering data is
      //useless because visible region is scrolled away before data appears
      //the user should spent some time on the page before loading it

      if (!this.loadPageRange)
         this.loadPageRange = debounce((startPage, endPage) => {
            let { data } = this.props;
            let { records, offset } = data;
            let promises = [];

            for (let page = startPage; page <= endPage; page++) {
               let s = (page - 1) * pageSize,
                  e = s + pageSize;
               if (s >= offset && e <= offset + records.length) {
                  promises.push(Promise.resolve(records.slice(s - offset, e - offset)));
               } else {
                  let result = instance.invoke(
                     "onFetchRecords",
                     {
                        page,
                        pageSize,
                        sorters: data.sorters,
                        sortField: data.sortField,
                        sortDirection: data.sortDirection,
                        filterParams: data.filterParams,
                        state: this.prevFetchRecordsState,
                     },
                     instance
                  );
                  promises.push(Promise.resolve(result));
               }
            }

            this.loading = true;

            Promise.all(promises)
               .then((pageRecords) => {
                  this.loading = false;
                  let records = [];
                  let totalRecordCount;
                  let lastPage;

                  pageRecords.forEach((page) => {
                     if (Array.isArray(page)) {
                        records.push(...page);
                     } else {
                        if (!Array.isArray(page.records))
                           throw new Error(
                              "onFetchRecords should return an array of records or an object with results inside records property."
                           );
                        totalRecordCount = page.totalRecordCount;
                        lastPage = page.lastPage;
                        this.prevFetchRecordsState = page.state;
                        records.push(...page.records);
                     }
                  });

                  let { data } = this.props;

                  if (!isNumber(totalRecordCount)) {
                     totalRecordCount = (startPage - 1) * pageSize + records.length;
                     if (!lastPage && records.length == (endPage - startPage + 1) * pageSize) totalRecordCount++;
                     if (data.totalRecordCount > totalRecordCount) totalRecordCount = data.totalRecordCount;
                  }

                  instance.buffer.totalRecordCount = data.totalRecordCount = totalRecordCount;
                  instance.buffer.records = data.records = records;
                  instance.buffer.page = data.page = startPage;
                  data.offset = (startPage - 1) * pageSize;

                  instance.store.silently(() => {
                     instance.set("records", records);
                     instance.set("page", startPage);
                     instance.set("totalRecordCount", totalRecordCount);
                  });

                  let stateChanges = {
                     startPage,
                     endPage,
                  };

                  if (this.state.end == 0) stateChanges.end = Math.min(widget.bufferSize, totalRecordCount);

                  this.setState(stateChanges, () => {
                     this.loadingStartPage = startPage;
                     this.loadingEndPage = endPage;
                     this.onScroll();
                  });
               })
               .catch((error) => {
                  this.loading = false;
                  if (widget.onLoadingError) instance.invoke(error, "onLoadingError", instance);
               });
         }, 30);

      if (startPage < this.loadingStartPage || endPage > this.loadingEndPage) {
         this.loadingStartPage = startPage;
         this.loadingEndPage = endPage;
         this.loadPageRange(startPage, endPage);
      }
   }

   onScroll() {
      //check if unmounted
      if (!this.dom.scroller) return;

      if (this.dom.fixedHeader) {
         this.dom.fixedHeader.scrollLeft = this.dom.scroller.scrollLeft;
      }

      if (this.dom.fixedFooter) {
         this.dom.fixedFooter.scrollLeft = this.dom.scroller.scrollLeft;
      }

      if (this.dom.fixedScroller) {
         this.dom.fixedScroller.scrollTop = this.dom.scroller.scrollTop;
      }

      let { instance, data } = this.props;
      let { widget } = instance;
      if (widget.buffered && !this.pending) {
         let start = 0;
         if (this.rowHeight > 0) {
            start = Math.round(this.dom.scroller.scrollTop / this.rowHeight - widget.bufferStep);
            start = Math.round(start / widget.bufferStep) * widget.bufferStep;
            start = Math.max(0, Math.min(start, data.totalRecordCount - widget.bufferSize));
         }
         let end = Math.min(data.totalRecordCount, start + widget.bufferSize);

         if (widget.infinite) {
            this.ensureData(start, end);
         }

         if (this.syncBuffering) {
            this.start = start;
            this.end = end;
         } else if (this.state.end != end) {
            this.pending = true;
            this.setState({ start, end }, () => {
               this.pending = false;
            });
         }
      }
   }

   onFixedColumnsWheel(e) {
      this.dom.scroller.scrollTop += event.deltaY;
      e.preventDefault();
   }

   shouldComponentUpdate(props, state) {
      return props.shouldUpdate !== false || state !== this.state;
   }

   componentDidMount() {
      this.componentDidUpdate();
      let { instance } = this.props;
      let { widget } = instance;
      if (widget.scrollable)
         this.offResize = ResizeManager.trackElement(this.dom.scroller, () => {
            //update fixed header/footer
            this.componentDidUpdate();
            instance.setState({
               dimensionsVersion: instance.state.dimensionsVersion + 1,
               lockedColWidth: {},
            });
         });
      if (widget.pipeKeyDown) instance.invoke("pipeKeyDown", this.handleKeyDown.bind(this), instance);
      this.unregisterDropZone = registerDropZone(this);
      if (widget.infinite) this.ensureData(0, 0);
      if (this.dom.fixedScroller) {
         this.onFixedColumnsWheel = this.onFixedColumnsWheel.bind(this);
         this.dom.fixedScroller.addEventListener("wheel", this.onFixedColumnsWheel, { passive: false });
      }
   }

   onDragStart(e) {
      let { instance } = this.props;
      let { widget } = instance;
      if (widget.onDragStart) instance.invoke("onDragStart", e, instance);
   }

   onDrop(e) {
      let { instance } = this.props;
      let { widget } = instance;
      let { start } = this.getBufferStartEnd();
      let { dropInsertionIndex, dropTarget } = this.state;
      if (dropTarget == 'grid' && widget.onDrop && dropInsertionIndex != null) {
         e.target = {
            insertionIndex: start + dropInsertionIndex,
            recordBefore: this.getRecordAt(start + dropInsertionIndex - 1),
            recordAfter: this.getRecordAt(start + dropInsertionIndex),
         };
         instance.invoke("onDrop", e, instance);
      }
      else if (dropTarget == 'row') {
         e.target = {
            index: start + dropInsertionIndex,
            record: this.getRecordAt(start + dropInsertionIndex),
         };
         instance.invoke("onRowDrop", e, instance);
      }
   }

   onDropTest(e) {
      let { instance } = this.props;
      let { widget } = instance;
      let grid = widget.onDropTest && instance.invoke("onDropTest", e, instance);
      let row = widget.onRowDropTest && instance.invoke("onRowDropTest", e, instance);
      return (grid || row) && { grid, row };
   }

   onDragEnd(e) {
      this.setState({
         dropInsertionIndex: null
      });
      let { instance } = this.props;
      let { widget } = instance;
      if (widget.onDragEnd) instance.invoke("onDragEnd", e, instance);
   }

   onDragMeasure(e) {
      let r = getTopLevelBoundingClientRect(this.dom.scroller);
      let { clientX, clientY } = e.cursor;

      if (clientX < r.left || clientX >= r.right || clientY < r.top || clientY >= r.bottom) return false;

      return {
         over: 1000,
      };
   }

   onDragOver(ev, { test: { grid, row } }) {
      let { instance } = this.props;
      let { widget, data } = instance;
      let { CSS, baseClass } = widget;
      let rowClass = CSS.element(baseClass, "data");
      let nodes = Array.from(this.dom.table.children).filter(
         (node) => node.className && node.className.indexOf(rowClass) != -1
      );
      let { start } = this.getBufferStartEnd();

      let s = 0,
         e = nodes.length,
         m,
         b;
      let parentOffset = getParentFrameBoundingClientRect(this.dom.scroller);
      let cy = ev.cursor.clientY - parentOffset.top;

      let rowOverIndex = null;

      while (s < e) {
         m = Math.floor((s + e) / 2);
         b = nodes[m].getBoundingClientRect();

         //dragged items might be invisible and have no client bounds
         if (b.top == 0 && b.bottom == 0) {
            //it's important to go all the way in one direction otherwise infinite loop might occur
            while (m > s && b.top == 0 && b.bottom == 0) {
               m--;
               b = nodes[m].getBoundingClientRect();
            }
            while (m + 1 < e && b.top == 0 && b.bottom == 0) {
               m = m + 1;
               b = nodes[m].getBoundingClientRect();
            }
            if (b.top == 0 && b.bottom == 0) {
               s = e = m;
               break;
            }
         }

         if (cy < b.top) e = m;
         else if (cy > b.bottom) s = m + 1;
         else {
            //hovering over a row here
            if (row) {
               let confirmed = !grid;
               if (!confirmed) {
                  let insertionZone = (b.bottom - b.top) / 4;
                  confirmed = cy > b.top + insertionZone && cy < b.bottom - insertionZone;
               }
               if (confirmed) {
                  rowOverIndex = m;
                  break;
               }
            }

            if (cy > (b.bottom + b.top) / 2) s = e = m + 1;
            else s = e = m;
         }
      }

      let cancel = false;

      if (rowOverIndex != null) {
         let evt = {
            ...ev,
            target: {
               record: this.getRecordAt(rowOverIndex),
               intex: start + rowOverIndex
            }
         }
         if (widget.onRowDragOver && instance.invoke("onRowDragOver", evt, instance) === false) cancel = true;
         else if (rowOverIndex != this.state.dropInsertionIndex || this.state.dropTarget != 'row') {
            this.setState({
               dropInsertionIndex: rowOverIndex,
               dropItemHeight: ev.source.height - 1,
               dropTarget: 'row'
            });
         }
      }
      else if (grid) {
         let evt = {
            ...ev,
            target: {
               recordBefore: this.getRecordAt(s - 1),
               recordAfter: this.getRecordAt(s),
               insertionIndex: start + s,
               totalRecordCount: data.totalRecordCount,
            },
         };
         if (widget.onDragOver && instance.invoke("onDragOver", evt, instance) === false) cancel = true;
         else if (s != this.state.dropInsertionIndex || this.state.dropTarget != 'grid') {
            this.setState({
               dropInsertionIndex: s,
               dropItemHeight: ev.source.height - 1,
               dropTarget: 'grid'
            });
         }
      }
      if (cancel) {
         this.setState({
            dropInsertionIndex: null,
            dropTarget: null
         });
      }
   }

   onDragLeave(e) {
      this.setState({
         dropInsertionIndex: null,
         dropTarget: null
      });
   }

   onGetHScrollParent() {
      let { widget } = this.props.instance;
      if (widget.scrollable) return this.dom.scroller;
      return findScrollableParent(this.dom.table, true);
   }

   onGetVScrollParent() {
      let { widget } = this.props.instance;
      if (widget.scrollable) return this.dom.scroller;
      return findScrollableParent(this.dom.table);
   }

   UNSAFE_componentWillReceiveProps(props) {
      let { data, widget, records } = props.instance;
      this.setState({
         cursor: Math.max(
            Math.min(this.state.cursor, (records ? records.length : data.totalRecordCount) - 1),
            widget.selectable && this.state.focused ? 0 : -1
         ),
      });
   }

   componentWillUnmount() {
      let { instance } = this.props;
      let { widget } = instance;
      if (this.offResize) this.offResize();

      offFocusOut(this);

      if (this.unregisterDropZone) this.unregisterDropZone();

      if (widget.pipeKeyDown) instance.invoke("pipeKeyDown", null, instance);

      if (this.dom.fixedScroller) {
         this.dom.fixedScroller.removeEventListener("wheel", this.onFixedColumnsWheel);
      }
   }

   componentDidUpdate() {
      let { instance, data } = this.props;
      let { widget, fixedFooterOverlap } = instance;

      if (
         widget.lockColumnWidths &&
         isArray(data.records) &&
         data.records.length >= widget.lockColumnWidthsRequiredRowCount
      ) {
         let headerTBody = this.dom.table.firstChild;
         for (let r = 0; r < headerTBody.children.length; r++) {
            let sr = headerTBody.children[r];
            for (let c = 0; c < sr.children.length; c++) {
               let cell = sr.children[c];
               cell.style.width = cell.style.minWidth = cell.style.maxWidth = `${sr.children[c].offsetWidth}px`;
               cell.style.boxSizing = "border-box";
               if (cell.dataset.uniqueColId)
                  instance.state.lockedColWidth[cell.dataset.uniqueColId] = sr.children[c].offsetWidth;
            }
         }
      }

      if (widget.scrollable) {
         this.scrollWidth = this.dom.scroller.offsetWidth - this.dom.scroller.clientWidth;

         let resized = false,
            headerHeight = 0,
            footerHeight = 0,
            rowHeight = 0;

         if (this.dom.fixedTable) syncHeaderHeights(this.dom.table.firstChild, this.dom.fixedTable.firstChild);

         if (this.dom.fixedHeader) {
            let fixedHeaderTBody = this.dom.fixedHeader.firstChild.firstChild;

            resized = widget.preciseMeasurements
               ? copyCellSizePrecise(this.dom.table.firstChild, fixedHeaderTBody)
               : copyCellSize(this.dom.table.firstChild, fixedHeaderTBody);

            let scrollColumnEl = fixedHeaderTBody.firstChild.lastChild;
            if (scrollColumnEl) scrollColumnEl.style.minWidth = scrollColumnEl.style.maxWidth = this.scrollWidth + "px";

            this.dom.fixedHeader.style.display = "block";
            headerHeight = this.dom.fixedHeader.offsetHeight;
            this.dom.scroller.style.marginTop = `${headerHeight}px`;
            if (this.dom.fixedScroller) this.dom.fixedScroller.style.marginTop = `${headerHeight}px`;
         } else {
            this.dom.scroller.style.marginTop = 0;
            if (this.dom.fixedScroller) this.dom.fixedScroller.style.marginTop = 0;
         }

         if (this.dom.fixedColumnsFixedHeader) {
            let fixedColumnsWidth = `${this.dom.fixedScroller.offsetWidth}px`;
            this.dom.fixedColumnsFixedHeader.style.right = "auto";
            this.dom.fixedColumnsFixedHeader.style.width = fixedColumnsWidth;
            if (this.dom.fixedHeader) this.dom.fixedHeader.style.left = fixedColumnsWidth;

            this.dom.fixedColumnsFixedHeader.style.display = "block";

            let fixedHeaderTBody = this.dom.fixedColumnsFixedHeader.firstChild.firstChild;

            if (this.dom.fixedTable.firstChild) {
               resized = copyCellSize(this.dom.fixedTable.firstChild, fixedHeaderTBody);
            }
         }

         if (this.dom.fixedFooter || this.dom.fixedColumnsFixedFooter) {
            if (this.dom.fixedColumnsFixedFooter) {
               let fixedColumnsWidth = `${this.dom.fixedScroller.offsetWidth}px`;
               this.dom.fixedColumnsFixedFooter.style.right = "auto";
               this.dom.fixedColumnsFixedFooter.style.width = fixedColumnsWidth;

               let dstTableBody = this.dom.fixedColumnsFixedFooter.firstChild.firstChild;
               if (dstTableBody) {
                  let srcTableBody = this.dom.fixedTable.lastChild;
                  copyCellSize(srcTableBody, dstTableBody, fixedFooterOverlap);
                  this.dom.fixedColumnsFixedFooter.style.display = "block";
                  footerHeight = this.dom.fixedFooter.offsetHeight;
               }
            }

            if (this.dom.fixedFooter) {
               let dstTableBody = this.dom.fixedFooter.firstChild.firstChild;

               if (dstTableBody) {
                  let srcTableBody = this.dom.table.lastChild;

                  copyCellSize(srcTableBody, dstTableBody, fixedFooterOverlap);

                  let scrollColumnEl = dstTableBody.firstChild.lastChild;
                  if (scrollColumnEl)
                     scrollColumnEl.style.minWidth = scrollColumnEl.style.maxWidth = this.scrollWidth + "px";

                  this.dom.fixedFooter.style.display = "block";
                  footerHeight = this.dom.fixedFooter.offsetHeight;
               }

               if (this.dom.fixedScroller) this.dom.fixedFooter.style.left = `${this.dom.fixedScroller.offsetWidth}px`;
            }

            this.dom.scroller.style.marginBottom = `${footerHeight}px`;
            if (this.dom.fixedScroller) this.dom.fixedScroller.style.marginBottom = `${footerHeight}px`;

            //Show the last row if fixed footer is shown without grouping, otherwise hide it.
            //For buffered grids, footer is never rendered within the body.
            //Hacky: accessing internal adapter property to check if grouping is applied
            if (!isNonEmptyArray(widget.dataAdapter.groupings) || widget.buffered) footerHeight = 0;
         } else {
            this.dom.scroller.style.marginBottom = 0;
            if (this.dom.fixedScroller) this.dom.fixedScroller.style.marginBottom = 0;
         }

         let scrollOverlap = fixedFooterOverlap ? footerHeight : 0;

         if (widget.buffered) {
            let { start, end } = this.getBufferStartEnd();
            let remaining = 0,
               count = Math.min(data.totalRecordCount, end - start);
            if (count > 0) {
               //do not change row height while a drag-drop operation is in place
               rowHeight = this.state.dragged ? this.rowHeight : Math.round((this.dom.table.offsetHeight - headerHeight) / count);
               // if (this.rowHeight && this.rowHeight != rowHeight) {
               //    console.warn("ROW-HEIGHT-CHANGE", this.rowHeight, rowHeight);
               // }
               remaining = Math.max(0, data.totalRecordCount - end);
            }
            this.dom.table.style.marginTop = `${(-headerHeight + start * rowHeight).toFixed(0)}px`;
            this.dom.table.style.marginBottom = `${(remaining * rowHeight - scrollOverlap).toFixed(0)}px`;
         } else {
            this.dom.table.style.marginTop = `${-headerHeight}px`;
            this.dom.table.style.marginBottom = `${-scrollOverlap}px`;
         }

         if (this.dom.fixedTable) {
            this.dom.fixedTable.style.marginTop = this.dom.table.style.marginTop;
            this.dom.fixedTable.style.marginBottom = this.dom.table.style.marginBottom;
         }

         this.rowHeight = rowHeight;

         let sortersChanged = widget.infinite && !shallowEquals(data.sorters, this.lastSorters);

         if (data.empty && !widget.infinite) {
            this.dom.scroller.scrollTop = 0;
         }

         if (
            sortersChanged ||
            data.filterParams !== this.lastScrollFilterParams ||
            data.scrollResetParams !== this.lastScrollResetParams
         ) {
            this.dom.scroller.scrollTop = 0;
            this.lastScrollFilterParams = data.filterParams;
            this.lastScrollResetParams = data.scrollResetParams;
            this.lastSorters = data.sorters;
            if (widget.infinite) {
               this.loadingStartPage = 0;
               this.loadingEndPage = 0;
               instance.buffer.records = data.records = [];
               instance.buffer.totalRecordCount = 0;
               instance.buffer.page = 1;
               this.prevFetchRecordsState = null;
            }
         }

         if (widget.scrollSelectionIntoView && !widget.buffered) {
            let { CSS, baseClass } = widget;
            let selectedRowSelector = `.${CSS.element(baseClass, "data")}.${CSS.state("selected")}`;
            let firstSelectedRow = this.dom.table.querySelector(selectedRowSelector);
            if (firstSelectedRow != this.selectedEl) {
               firstSelectedRow && scrollElementIntoView(firstSelectedRow);
               this.selectedEl = firstSelectedRow;
            }
         }

         setTimeout(this.onScroll.bind(this), 0);

         if (resized) instance.fixedHeaderResizeEvent.notify();
      }
   }

   moveCursor(
      index,
      { focused, hover, scrollIntoView, select, selectRange, selectOptions, cellIndex, cellEdit, cancelEdit } = {}
   ) {
      let { widget, visibleColumns } = this.props.instance;
      if (!widget.selectable && !widget.cellEditable) return;

      let newState = {};

      if (cellEdit != null && cellEdit != this.state.cellEdit) {
         newState.cellEdit = cellEdit;
         if (
            cellEdit &&
            (!visibleColumns[this.state.cursorCellIndex] || !visibleColumns[this.state.cursorCellIndex].editor)
         )
            newState.cellEdit = false;
      }

      if (cellIndex != null && cellIndex != this.state.cursorCellIndex) {
         newState.cursorCellIndex = cellIndex;
         newState.cellEdit = false;
      }

      if (widget.focused) focused = true;

      if (focused != null && this.state.focused != focused) {
         newState.focused = focused;
         newState.cellEdit = false;
      }

      if (index != this.state.cursor) {
         newState.cursor = index;
         newState.cellEdit = false;
      }

      if (select) {
         let start = selectRange && this.state.selectionStart >= 0 ? this.state.selectionStart : index;
         if (start < 0) start = index;
         this.selectRange(start, index, selectOptions);
         if (!selectRange) newState.selectionStart = index;
      }

      if (Object.keys(newState).length > 0) {
         let prevState = this.state;
         let wasCellEditing = prevState.focused && prevState.cellEdit;
         let futureState = { ...this.state, ...newState };

         if (!futureState.cellEdit && wasCellEditing) {
            //If cell editing is in progress, moving the cursor may cause that the cell editor is unmounted before
            //the blur event which may cause data loss for components which do not have reactOn=change set, e.g. NumberField.
            getActiveElement().blur();
            let record = this.getRecordAt(prevState.cursor);
            if ((!this.cellEditorValid || cancelEdit) && this.cellEditUndoData)
               record.store.set(widget.recordName, this.cellEditUndoData);
            else {
               let newData = record.store.get(widget.recordName); //record.data might be stale at this point
               if (widget.onCellEdited && newData != this.cellEditUndoData)
                  this.props.instance.invoke(
                     "onCellEdited",
                     {
                        column: visibleColumns[prevState.cursorCellIndex],
                        newData,
                        oldData: this.cellEditUndoData,
                        field: visibleColumns[prevState.cursorCellIndex].field,
                     },
                     record
                  );
            }
         }

         if (futureState.cellEdit && !wasCellEditing) this.cellEditUndoData = this.getRecordAt(futureState.cursor).data;

         this.setState(newState, () => {
            if (this.state.focused && !this.state.cellEdit && wasCellEditing) FocusManager.focus(this.dom.el);

            if (scrollIntoView) {
               let record = this.getRecordAt(index);

               let item = record && this.dom.table.querySelector(`tbody[data-record-key="${record.key}"]`);

               let hscroll = false;
               if (item) {
                  if (widget.cellEditable)
                     if (this.state.cursorCellIndex >= this.props.instance.fixedColumnCount) {
                        hscroll = true;
                        item =
                           item.firstChild.children[this.state.cursorCellIndex - this.props.instance.fixedColumnCount];
                     } else {
                        let fixedItem = this.dom.fixedTable.querySelector(`tbody[data-record-key="${record.key}"]`);
                        let cell = fixedItem && fixedItem.firstChild.children[this.state.cursorCellIndex];
                        if (cell) scrollElementIntoView(cell, false, true, 10);
                     }

                  scrollElementIntoView(item, true, hscroll, widget.cellEditable ? 10 : 0);
               }
            }
         });
      }
   }

   showCursor(focused) {
      let { records, isSelected } = this.props.instance;
      let cursor = this.state.cursor;
      if (cursor == -1) {
         if (records) {
            cursor = records.findIndex((x) => isSelected(x.data, x.index));
            //if there are no selected records, find the first data record (skip group header)
            if (cursor == -1) cursor = records.findIndex((x) => x.type == "data");
         } else cursor = 0;
      }
      this.moveCursor(cursor, { focused: true, scrollIntoView: false });
   }

   onFocus() {
      FocusManager.nudge();

      //focus moved within the grid
      if (this.state.focused) {
         if (this.state.cellEdit && this.dom.el == getActiveElement())
            this.moveCursor(this.state.cursor, {
               cellEdit: false,
            });
         return;
      }

      let { widget } = this.props.instance;

      //the cursor will be set if focus in originating from a mouse event
      setTimeout(() => {
         this.showCursor(true);
      }, 0);

      if (!widget.focused) {
         if (this.dom.el) {
            //if an inner element is focused first (autoFocus), this.dom.el might be undefined
            oneFocusOut(this, this.dom.el, () => {
               this.moveCursor(-1, { focused: false });
            });
         }
      }

      this.setState({
         focused: true,
      });
   }

   onBlur() {
      FocusManager.nudge();
   }

   selectRange(from, to, options) {
      let { instance, data } = this.props;
      let { records, widget } = instance;

      if (from > to) {
         let tmp = from;
         from = to;
         to = tmp;
      }

      options = {
         ...options,
         range: from < to,
      };

      let selection = [],
         indexes = [];

      for (let cursor = from; cursor <= to; cursor++) {
         let record;
         if (records) record = records[cursor];
         else {
            let offset = widget.infinite ? data.offset : 0;
            let r = data.records[cursor - offset];
            if (r) record = widget.mapRecord(null, instance, r, cursor - offset);
         }
         if (record && record.type == "data") {
            if (instance.isRecordSelectable && !instance.isRecordSelectable(record.data, options)) continue;
            selection.push(record.data);
            indexes.push(record.index);
         }
      }

      widget.selection.selectMultiple(instance.store, selection, indexes, options);
   }

   getRecordAt(cursor) {
      let { instance, data } = this.props;
      let { records, widget } = instance;

      if (records) return records[cursor];

      let offset = widget.infinite ? data.offset : 0;
      let r = data.records[cursor - offset];
      if (r) return widget.mapRecord(null, instance, r, cursor - offset);

      return null;
   }

   getRecordInstanceAt(cursor) {
      let record = this.getRecordAt(cursor);
      if (!record) return null;
      let { instance } = this.props;
      if (instance.recordInstanceCache)
         return instance.recordInstanceCache.getChild(instance.widget.row, record.store, record.key);

      //different signature
      return instance.getChild(null, instance.widget.row, record.key, record.store);
   }

   handleKeyDown(e) {
      let { instance, data } = this.props;
      let { widget } = instance;

      if (widget.onKeyDown && instance.invoke("onKeyDown", e, instance) === false) return;

      let recordInstance = this.getRecordInstanceAt(this.state.cursor);
      if (recordInstance && widget.onRowKeyDown && instance.invoke("onRowKeyDown", e, recordInstance) === false) return;

      switch (e.keyCode) {
         case KeyCode.enter:
            this.moveCursor(this.state.cursor, {
               select: true,
               selectOptions: {
                  toggle: e.ctrlKey,
               },
               selectRange: e.shiftKey,
               cellEdit: widget.cellEditable && !this.state.cellEdit,
               focused: true,
            });
            e.stopPropagation();
            e.preventDefault();
            break;

         case KeyCode.esc:
            if (this.state.cellEdit) {
               this.moveCursor(this.state.cursor, {
                  cellEdit: false,
                  focused: true,
                  cancelEdit: true,
               });
               e.stopPropagation();
               e.preventDefault();
            }
            break;

         case KeyCode.tab:
            if (widget.cellEditable) {
               e.stopPropagation();
               e.preventDefault();
               let direction = e.shiftKey ? -1 : +1;
               let cursor = this.state.cursor;
               let cellIndex = (this.state.cursorCellIndex + direction) % widget.row.line1.columns.length;
               if (cellIndex == -1) {
                  cellIndex += widget.row.line1.columns.length;
                  cursor--;
               } else if (cellIndex == 0 && direction > 0) cursor++;
               for (; ; cursor += direction) {
                  let record = this.getRecordAt(cursor);
                  if (!record) break;
                  if (record.type != "data") continue;
                  this.moveCursor(cursor, {
                     focused: true,
                     cellIndex,
                     scrollIntoView: true,
                     cellEdit: false,
                  });
                  break;
               }
            }
            break;

         case KeyCode.down:
            for (let cursor = this.state.cursor + 1; ; cursor++) {
               let record = this.getRecordAt(cursor);
               if (!record) break;
               if (record.type != "data") continue;
               this.moveCursor(cursor, {
                  focused: true,
                  scrollIntoView: true,
                  select: e.shiftKey,
                  selectRange: true,
               });
               break;
            }
            e.stopPropagation();
            e.preventDefault();
            break;

         case KeyCode.up:
            for (let cursor = this.state.cursor - 1; cursor >= 0; cursor--) {
               let record = this.getRecordAt(cursor);
               if (!record) break;
               if (record.type != "data") continue;
               this.moveCursor(cursor, {
                  focused: true,
                  scrollIntoView: true,
                  select: e.shiftKey,
                  selectRange: true,
               });
               break;
            }
            e.stopPropagation();
            e.preventDefault();
            break;

         case KeyCode.right:
            if (widget.cellEditable) {
               if (this.state.cursorCellIndex + 1 < widget.row.line1.columns.length) {
                  this.moveCursor(this.state.cursor, {
                     focused: true,
                     cellIndex: this.state.cursorCellIndex + 1,
                     scrollIntoView: true,
                  });
               }
               e.stopPropagation();
               e.preventDefault();
            }
            break;

         case KeyCode.left:
            if (widget.cellEditable) {
               if (this.state.cursorCellIndex > 0) {
                  this.moveCursor(this.state.cursor, {
                     focused: true,
                     cellIndex: this.state.cursorCellIndex - 1,
                     scrollIntoView: true,
                  });
               }
               e.stopPropagation();
               e.preventDefault();
            }
            break;

         case KeyCode.a:
            if (!e.ctrlKey || !widget.selection.multiple) return;

            if (e.target.nodeName == "INPUT" || e.target.nodeName == "TEXTAREA") return;

            this.selectRange(0, data.totalRecordCount);

            e.stopPropagation();
            e.preventDefault();
            break;
      }
   }

   beginDragDrop(e, record) {
      let { instance, data } = this.props;
      let { widget, store } = instance;

      //get a fresh isSelected delegate
      let isSelected = widget.selection.getIsSelectedDelegate(store);

      let selected = [];

      let add = (rec, data, index, force) => {
         if (!data || !(force || isSelected(data, index))) return;
         let mappedRecord = rec ? { ...rec } : widget.mapRecord(null, instance, data, index);
         let row = mappedRecord.row = instance.getDetachedChild(widget.row, "DD:" + mappedRecord.key, mappedRecord.store);
         row.selected = true;
         selected.push(mappedRecord);
      }

      if (!record.selected) {
         if (instance.records)
            instance.records.forEach(r => add(r, r.data, r.index));
         else
            this.getRecordsSlice(0, data.totalRecordCount).forEach((r, index) => add(null, r, index));
      }

      if (selected.length == 0) add(record, record.data, record.index, true);

      let renderRow = this.createRowRenderer(false);

      let contents = selected.map((record, i) => renderRow(record, i, true, false));

      initiateDragDrop(
         e,
         {
            sourceEl: closest(e.currentTarget, (a) => a.tagName == "TBODY"),
            source: {
               data: data.dragSource.data,
               store: store,
               record: record,
               records: selected,
            },
            clone: {
               store: record.store,
               matchCursorOffset: true,
               matchWidth: true,
               widget: () => (
                  <div className={data.classNames}>
                     <table>{contents}</table>
                  </div>
               ),
            },
         },
         () => {
            this.setState({
               dragged: false,
            });
         }
      );

      this.setState({
         dragged: record,
      });
   }
}

class GridColumnHeaderLine extends PureContainer {
   declareData() {
      return super.declareData(...arguments, {
         showHeader: undefined,
      });
   }

   init() {
      this.items = Widget.create(GridColumnHeader, this.columns || []);
      this.visible = this.showHeader;
      this.style = this.headerStyle;
      this.className = this.headerClass;
      this.class = null;
      super.init();
   }

   render(context, instance, key) {
      let { data } = instance;
      return (
         <tr key={key} className={data.classNames} style={data.style}>
            {this.renderChildren(context, instance)}
         </tr>
      );
   }
}

GridColumnHeaderLine.prototype.isPureContainer = false;
GridColumnHeaderLine.prototype.styled = true;
GridColumnHeaderLine.prototype.showHeader = true;
GridColumnHeaderLine.autoInit = true;

class GridColumnHeader extends Widget {
   declareData() {
      return super.declareData(...arguments, {
         format: undefined,
         width: undefined,
         defaultWidth: undefined,
         fixed: undefined,
      });
   }

   init() {
      delete this.style;
      delete this.className;
      delete this.class;

      if (this.header) this.header1 = this.header;

      if (this.header1 || this.resizable || this.width || this.defaultWidth || this.sortable) {
         if (!isObject(this.header1))
            this.header1 = {
               text: this.header1 || "",
            };

         if (this.resizable) this.header1.resizable = this.resizable;

         if (this.width) this.header1.width = this.width;

         if (this.defaultWidth) this.header1.defaultWidth = this.defaultWidth;
      }

      if (this.header2 && isSelector(this.header2))
         this.header2 = {
            text: this.header2,
         };

      if (this.header3 && isSelector(this.header3))
         this.header3 = {
            text: this.header3,
         };

      if (!this.aggregateField && this.field) this.aggregateField = this.field;

      if (!this.aggregateAlias) this.aggregateAlias = this.aggregateField;

      if (this.footer && isSelector(this.footer))
         this.footer = {
            value: this.footer,
            pad: this.pad,
            format: this.format,
         };

      if (this.footer) this.footer.value = getSelector(this.footer.value);

      if (this.caption && isSelector(this.caption))
         this.caption = {
            value: this.caption,
            pad: this.pad,
            format: this.format,
         };

      if (this.caption) {
         let children = this.caption.children || this.caption.items;
         if (children) {
            delete this.caption.items;
            this.caption.children = Widget.create(children);
         } else this.caption.value = getSelector(this.caption.value);
      }

      super.init();
   }

   initComponents() {
      return super.initComponents({
         header1: this.header1 && GridColumnHeaderCell.create(this.header1),
         header2: this.header2 && GridColumnHeaderCell.create(this.header2),
         header3: this.header3 && GridColumnHeaderCell.create(this.header3),
      });
   }

   render() {
      return null;
   }
}

GridColumnHeader.autoInit = true;

class GridColumnHeaderCell extends PureContainer {
   declareData() {
      return super.declareData(...arguments, {
         text: undefined,
         colSpan: undefined,
         rowSpan: undefined,
         width: undefined,
         defaultWidth: undefined,
         resizable: undefined,
         fixed: undefined,
      });
   }

   initComponents() {
      return super.initComponents(...arguments, {
         tool: this.tool && Widget.create(this.tool),
      });
   }

   render(context, instance, key) {
      let { data } = instance;
      return data.text || super.render(context, instance, key);
   }
}

GridColumnHeaderCell.prototype.colSpan = 1;
GridColumnHeaderCell.prototype.rowSpan = 1;
GridColumnHeaderCell.prototype.allowSorting = true;
GridColumnHeaderCell.prototype.styled = true;
GridColumnHeaderCell.prototype.fixed = false;

function initGrouping(grouping) {
   grouping.forEach((g) => {
      if (g.caption) g.caption = getSelector(g.caption);
   });
}

function copyCellSize(srcTableBody, dstTableBody, applyHeight = true) {
   if (!srcTableBody || !dstTableBody) return false;

   let changed = false;
   for (let r = 0; r < dstTableBody.children.length && r < srcTableBody.children.length; r++) {
      let sr = srcTableBody.children[r];
      let dr = dstTableBody.children[r];
      for (let c = 0; c < dr.children.length && c < sr.children.length; c++) {
         let dc = dr.children[c];
         let ws = `${sr.children[c].offsetWidth}px`;
         if (!changed && dc.style.width != ws) changed = true;
         dc.style.width = dc.style.minWidth = dc.style.maxWidth = ws;
         if (applyHeight) dc.style.height = `${sr.children[c].offsetHeight}px`;
      }
   }
   return changed;
}

function copyCellSizePrecise(srcTableBody, dstTableBody, applyHeight = true) {
   if (!srcTableBody || !dstTableBody) return false;
   let changed = false;
   for (let r = 0; r < dstTableBody.children.length && r < srcTableBody.children.length; r++) {
      let sr = srcTableBody.children[r];
      let dr = dstTableBody.children[r];
      for (let c = 0; c < dr.children.length && c < sr.children.length; c++) {
         let dc = dr.children[c];
         let bounds = sr.children[c].getBoundingClientRect();
         let ws = `${bounds.width}px`;
         if (!changed && dc.style.width != ws) changed = true;
         dc.style.width = dc.style.minWidth = dc.style.maxWidth = ws;
         if (applyHeight) dc.style.height = `${bounds.height}px`;
      }
   }
   return changed;
}

function syncHeaderHeights(header1, header2) {
   /**
    * In the first pass measure all row heights.
    * In the second pass apply those heights.
    * Use getBoundingClientRect() for sub-pixel accuracy.
    */

   if (!header1 || !header2) return;
   const rowCount = Math.max(header1.children.length, header2.children.length);
   let rowHeight = [];
   for (let r = 0; r < rowCount; r++) {
      rowHeight.push(0);
      let tr1 = header1.children[r];
      let tr2 = header2.children[r];
      if (tr1) {
         for (let i = 0; i < tr1.children.length; i++) {
            let td = tr1.children[i];
            let h = td.getBoundingClientRect().height;
            if (td.rowSpan == 1 && h > rowHeight[r]) {
               rowHeight[r] = h;
               break;
            }
         }
      }
      if (tr2) {
         for (let i = 0; i < tr2.children.length; i++) {
            let td = tr2.children[i];
            let h = td.getBoundingClientRect().height;
            if (td.rowSpan == 1 && h > rowHeight[r]) {
               rowHeight[r] = h;
               break;
            }
         }
      }
   }

   for (let r = 0; r < rowCount; r++) {
      let tr1 = header1.children[r];
      let tr2 = header2.children[r];
      if (tr1) {
         for (let i = 0; i < tr1.children.length; i++) {
            let td = tr1.children[i];
            let h = 0;
            for (let x = 0; x < td.rowSpan; x++) h += rowHeight[r + x];
            td.style.height = `${h}px`;
         }
      }
      if (tr2) {
         for (let i = 0; i < tr2.children.length; i++) {
            let td = tr2.children[i];
            let h = 0;
            for (let x = 0; x < td.rowSpan; x++) h += rowHeight[r + x];
            td.style.height = `${h}px`;
         }
      }
   }
}
