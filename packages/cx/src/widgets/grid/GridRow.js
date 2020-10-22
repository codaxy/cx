import { ValidationGroup } from "../../widgets/form/ValidationGroup";
import { VDOM } from "../../ui/Widget";
import { ddMouseDown, ddMouseUp, ddDetect, isDragHandleEvent } from "../drag-drop/ops";
import { isTouchEvent } from "../../util/isTouchEvent";
import { preventFocusOnTouch } from "../../ui/FocusManager";
import { GridRowLine } from "./GridRowLine";
import { closest, isFocusedDeep } from "../../util/DOM";
import { KeyCode } from "../../util/KeyCode";
import { getActiveElement } from "../../util/getActiveElement";

export class GridRow extends ValidationGroup {
   declareData(...args) {
      super.declareData(...args, {
         hoverId: undefined,
      });
   }

   init() {
      this.items = [];
      for (let i = 0; i < 10; i++) {
         if (this["line" + i])
            this.items.push(
               GridRowLine.create(this["line" + i], {
                  recordName: this.recordName,
               })
            );
      }
      super.init();
   }

   explore(context, instance) {
      context.push("dragHandles", (instance.dragHandles = []));
      super.explore(context, instance);
   }

   exploreCleanup(context, instance) {
      super.exploreCleanup(context, instance);
      context.pop("dragHandles");
   }
}

GridRow.prototype.styled = true; //styles used on the wrapper component

export class GridRowComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onMouseLeave = this.onMouseLeave.bind(this);
      this.onClick = this.onClick.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);

      let { grid, instance } = props;

      if (grid.widget.onRowDoubleClick)
         this.onDoubleClick = (e) => {
            grid.invoke("onRowDoubleClick", e, instance);
         };

      if (grid.widget.cellEditable)
         this.onDoubleClick = (e) => {
            this.props.parent.moveCursor(this.props.cursorIndex, {
               cellEdit: true,
            });
            e.preventDefault(); //prevent text selection
         };

      if (grid.widget.onRowContextMenu)
         this.onRowContextMenu = (e) => {
            grid.invoke("onRowContextMenu", e, instance);
         };
   }

   render() {
      let { className, dragSource, instance, record } = this.props;
      let { data, widget } = instance;
      let { CSS } = widget;
      let move, up, keyDown, leave;

      if (dragSource || data.hoverId) {
         move = this.onMouseMove;
         up = ddMouseUp;
      }

      if (data.hoverId) {
         leave = this.onMouseLeave;
      }

      if (widget.onRowClick) keyDown = this.onKeyDown;

      return (
         <tbody
            className={CSS.expand(data.classNames, className, this.state && this.state.hover && CSS.state("hover"))}
            style={data.style}
            onClick={this.onClick}
            onDoubleClick={this.onDoubleClick}
            onTouchStart={this.onMouseDown}
            onMouseDown={this.onMouseDown}
            onTouchMove={move}
            onMouseMove={move}
            onMouseLeave={leave}
            onTouchEnd={up}
            onMouseUp={up}
            onKeyDown={keyDown}
            onContextMenu={this.onRowContextMenu}
            data-record-key={record.key}
         >
            {this.props.children}
         </tbody>
      );
   }

   onMouseDown(e) {
      let { grid, record, instance, parent, cursorIndex } = this.props;

      if (this.props.dragSource) {
         ddMouseDown(e);
         if (isDragHandleEvent(e) || instance.dragHandles.length == 0) {
            e.preventDefault();
            e.stopPropagation();

            //close context menu
            if (!getActiveElement().contains(e.target)) document.activeElement.blur();
         }
      }

      let { store, widget } = grid;

      if (widget.selectable) preventFocusOnTouch(e);

      parent.moveCursor(cursorIndex, {
         select:
            !isTouchEvent() &&
            (e.shiftKey || e.ctrlKey || !widget.selection.isSelected(store, record.data, record.index)),
         selectRange: e.shiftKey,
         selectOptions: {
            toggle: e.ctrlKey,
         },
         cellIndex: this.getCellIndex(e),
      });

      if (e.shiftKey && !isTouchEvent()) e.preventDefault();
   }

   onMouseMove(e) {
      let { grid, instance, parent, record } = this.props;
      if (ddDetect(e) && (isDragHandleEvent(e) || instance.dragHandles.length == 0)) parent.beginDragDrop(e, record);
      if (grid.hoverSync && instance.data.hoverId != null)
         grid.hoverSync.report(grid.widget.hoverChannel, instance.data.hoverId, true);
   }

   onMouseLeave(e) {
      let { grid, instance } = this.props;
      if (grid.hoverSync && instance.data.hoverId != null)
         grid.hoverSync.report(grid.widget.hoverChannel, instance.data.hoverId, false);
   }

   getCellIndex(e) {
      let td = closest(e.target, (node) => node.tagName == "TD");
      if (td)
         return (
            (this.props.fixed ? 0 : this.props.grid.fixedColumnCount) +
            Array.from(td.parentElement.children).indexOf(td)
         );
      return -1;
   }

   onKeyDown(e) {
      let { grid, instance } = this.props;

      if (e.keyCode == KeyCode.enter && grid.invoke("onRowClick", e, instance) === false) {
         e.stopPropagation();
      }
   }

   onClick(e) {
      let { grid, record, instance, parent, cursorIndex } = this.props;
      let { store, widget } = grid;

      if (grid.widget.onRowClick) {
         if (grid.invoke("onRowClick", e, instance) === false) return;
      }

      e.stopPropagation();

      parent.moveCursor(cursorIndex, {
         select:
            isTouchEvent() ||
            (!e.shiftKey && !e.ctrlKey && widget.selection.isSelected(store, record.data, record.index)),
         selectRange: e.shiftKey,
         selectOptions: {
            toggle: e.ctrlKey,
         },
         cellIndex: this.getCellIndex(e),
      });
   }

   shouldComponentUpdate(props, state) {
      return (
         props.shouldUpdate !== false ||
         props.record != this.props.record ||
         props.cursor != this.props.cursor ||
         props.selected != this.props.selected ||
         props.isBeingDragged != this.props.isBeingDragged ||
         props.cursorIndex !== this.props.cursorIndex ||
         props.cursorCellIndex !== this.props.cursorCellIndex ||
         props.cellEdit !== this.props.cellEdit ||
         props.dimensionsVersion !== this.props.dimensionsVersion ||
         props.isDraggedOver !== this.props.isDraggedOver ||
         state !== this.state
      );
   }

   compontentWillUnmount() {
      this.unsubscribeHoverSync && this.unsubscribeHoverSync();
   }

   componentDidMount() {
      let { grid } = this.props;
      if (grid.hoverSync) {
         this.unsubscribeHoverSync = grid.hoverSync.subscribe(grid.widget.hoverChannel, (hoverId) => {
            let hover = hoverId === this.props.instance.data.hoverId;
            if (!this.state || hover !== this.state.hover) this.setState({ hover });
         });
      }
   }
}
