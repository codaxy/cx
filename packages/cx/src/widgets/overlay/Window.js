import { Widget, VDOM, getContent } from "../../ui/Widget";
import { Overlay, OverlayComponent } from "./Overlay";
import { ContentPlaceholder } from "../../ui/layout/ContentPlaceholder";
import { ZIndexManager } from "../../ui/ZIndexManager";
import { Button } from "../Button";
import { parseStyle } from "../../util/parseStyle";
import { Localization } from "../../ui/Localization";
import { stopPropagation } from "../../util/eventCallbacks";
import { ddMouseDown, ddDetect, ddMouseUp } from "../drag-drop/ops";
import { isDefined } from "../../util/isDefined";
import { isString } from "../../util/isString";
import { KeyCode } from "../../util/KeyCode";

export class Window extends Overlay {
   init() {
      if (isDefined(this.closeable)) this.closable = this.closeable;

      if (isString(this.headerStyle)) this.headerStyle = parseStyle(this.headerStyle);

      if (isString(this.footerStyle)) this.footerStyle = parseStyle(this.footerStyle);

      if (isString(this.bodyStyle)) this.bodyStyle = parseStyle(this.bodyStyle);

      super.init();
   }

   declareData() {
      return super.declareData(...arguments, {
         title: undefined,
         closable: undefined,
         bodyStyle: { structured: true },
         bodyClass: { structured: true },
         headerStyle: { structured: true },
         footerStyle: { structured: true },
      });
   }

   initHelpers() {
      return super.initHelpers(...arguments, {
         header: Widget.create(this.header || { type: ContentPlaceholder, name: "header", scoped: true }),
         footer: Widget.create(this.footer || { type: ContentPlaceholder, name: "footer", scoped: true }),
         close:
            this.closable &&
            Button.create({
               mod: "hollow",
               dismiss: true,
               icon: "close",
               style: "margin-left: auto",
               onTouchStart: stopPropagation,
               onMouseDown: stopPropagation,
            }),
      });
   }

   exploreCleanup(context, instance) {
      super.exploreCleanup(context, instance);

      let { helpers } = instance;
      let unregisterHeader = helpers.header && helpers.header.unregisterContentPlaceholder;
      if (unregisterHeader) unregisterHeader();

      let unregisterFooter = helpers.footer && helpers.footer.unregisterContentPlaceholder;
      if (unregisterFooter) unregisterFooter();
   }

   renderHeader(context, instance, key) {
      let { data } = instance;
      let result = [];
      if (data.title) result.push(data.title);
      if (instance.helpers) {
         let header = getContent(instance.helpers.header && instance.helpers.header.render(context, key));
         if (header) result.push(header);
         if (data.closable && instance.helpers.close) result.push(getContent(instance.helpers.close.render(context)));
      }
      return result;
   }

   renderFooter(context, instance, key) {
      return getContent(instance.helpers && instance.helpers.footer && instance.helpers.footer.render(context, key));
   }

   render(context, instance, key) {
      var header = this.renderHeader(context, instance, "header");
      var footer = this.renderFooter(context, instance, "footer");
      return (
         <WindowComponent key={key} instance={instance} header={header} footer={footer}>
            {this.renderContents(context, instance)}
         </WindowComponent>
      );
   }

   handleKeyDown(event, instance, component) {
      if (super.handleKeyDown(event, instance, component) == false) return;

      if (this.closeOnEscape && event.keyCode == KeyCode.esc && instance.dismiss) instance.dismiss();
   }
}

Window.prototype.baseClass = "window";
Window.prototype.closable = true;
Window.prototype.resizable = false;
Window.prototype.fixed = false;
Window.prototype.autoFocus = true;
Window.prototype.focusable = true;
Window.prototype.closeOnEscape = false;

Widget.alias("window", Window);
Localization.registerPrototype("cx/widgets/Window", Window);

class WindowComponent extends OverlayComponent {
   renderOverlayBody() {
      var { widget, data } = this.props.instance;
      var { CSS, baseClass } = widget;

      let header, footer;

      if (this.props.header.length > 0) {
         header = (
            <header
               key="header"
               ref={(c) => {
                  this.headerEl = c;
               }}
               className={CSS.element(baseClass, "header")}
               style={data.headerStyle}
               onMouseDown={this.onHeaderMouseDown.bind(this)}
               onMouseUp={ddMouseUp}
               onMouseMove={this.onHeaderMouseMove.bind(this)}
               onTouchStart={this.onHeaderMouseDown.bind(this)}
               onTouchEnd={ddMouseUp}
               onTouchMove={this.onHeaderMouseMove.bind(this)}
            >
               {this.props.header}
            </header>
         );
      }

      if (this.props.footer) {
         footer = (
            <footer
               key="footer"
               ref={(c) => {
                  this.footerEl = c;
               }}
               className={CSS.element(baseClass, "footer")}
               style={data.footerStyle}
            >
               {this.props.footer}
            </footer>
         );
      }

      var body = (
         <div
            key="body"
            ref={(c) => {
               this.bodyEl = c;
            }}
            className={CSS.expand(CSS.element(widget.baseClass, "body"), data.bodyClass)}
            style={data.bodyStyle}
         >
            {this.props.children}
         </div>
      );

      return [header, body, footer];
   }

   getOverlayCssClass() {
      var cls = super.getOverlayCssClass();
      if (this.state.active) cls += " cxs-active";
      return cls;
   }

   onFocusIn() {
      super.onFocusIn();
      if (!this.state.active) {
         this.setState(
            {
               active: true,
            },
            () => {
               //React portals cause focusin events which may actually belong to another window or a dropdown
               if (this.containerEl.contains(document.activeElement)) this.setZIndex(ZIndexManager.next());
            }
         );
      }
   }

   onFocusOut() {
      super.onFocusOut();
      if (this.state.active) {
         this.setState({
            active: false,
         });
      }
   }

   onHeaderMouseDown(e) {
      e.stopPropagation();
      ddMouseDown(e);
   }

   onHeaderMouseMove(e) {
      e.stopPropagation();
      if (!this.props.instance.widget.fixed && ddDetect(e)) {
         this.startMoveOperation(e);
      }
   }
}
