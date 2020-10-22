import { Widget, VDOM } from "../../ui/Widget";
import { Container } from "../../ui/Container";
import { startAppLoop } from "../../ui/app/startAppLoop";
import { FocusManager, oneFocusOut, offFocusOut } from "../../ui/FocusManager";
import { isSelfOrDescendant, closest } from "../../util/DOM";
import { parseStyle } from "../../util/parseStyle";
import { captureMouseOrTouch } from "./captureMouse";
import { ZIndexManager } from "../../ui/ZIndexManager";
import { ddMouseDown, ddMouseUp, ddDetect } from "../drag-drop/ops";
import { isObject } from "../../util/isObject";
import { isBinding } from "../../data/Binding";
import { getTopLevelBoundingClientRect } from "../../util/getTopLevelBoundingClientRect";
import { addEventListenerWithOptions } from "../../util/addEventListenerWithOptions";
import { stopPropagation } from "../../util";

/*
 Features:
 - renders itself on top of other elements
 - provide resizing capabilities
 - adds positioning hook and ability to position itself in the center of the page
 - provides header, body, and footer elements and updates body's height on resize (move this to Window)
 - stop mouse events from bubbling to parents, but allow keystrokes
 */

export class Overlay extends Container {
   declareData() {
      return super.declareData(...arguments, {
         shadowStyle: {
            structured: true,
         },
         resizable: undefined,
         draggable: undefined,
      });
   }

   prepareData(context, instance) {
      let { data } = instance;
      data.stateMods = {
         ...data.stateMods,
         inline: this.inline,
         modal: this.modal,
         pad: this.pad,
         resizable: data.resizable,
         draggable: data.draggable,
         animate: this.animate,
         shadow: this.modal || this.backdrop,
      };

      super.prepareData(context, instance);
   }

   explore(context, instance) {
      if (isBinding(this.visible)) {
         if (!instance.dismiss) {
            instance.dismiss = () => {
               if (instance.onBeforeDismiss && instance.onBeforeDismiss() === false) return;
               instance.set("visible", false);
            };
         }
      } else if (context.options.dismiss) instance.dismiss = context.options.dismiss;

      if (instance.dismiss) {
         context.push("parentOptions", {
            ...context.parentOptions,
            dismiss: instance.dismiss,
         });
      }

      if (instance.cache("dismiss", instance.dismiss)) instance.markShouldUpdate(context);

      super.explore(context, instance);
   }

   exploreCleanup(context, instance) {
      if (instance.dismiss) context.pop("parentOptions");
   }

   render(context, instance, key) {
      return (
         <OverlayComponent
            key={key}
            instance={instance}
            subscribeToBeforeDismiss={context.options.subscribeToBeforeDismiss}
            parentEl={context.options.parentEl}
         >
            {this.renderContents(context, instance)}
         </OverlayComponent>
      );
   }

   renderContents(context, instance) {
      return this.renderChildren(context, instance);
   }

   overlayDidMount(instance, component) {
      if (this.center) {
         let { el } = component;
         if (!el.style.left) el.style.left = `${(window.innerWidth - el.offsetWidth) / 2}px`;
         if (!el.style.top) el.style.top = `${Math.max(0, (window.innerHeight - el.offsetHeight) / 2)}px`;
      }
   }

   overlayDidUpdate(instance, component) {}

   overlayWillUnmount(instance, component) {}

   handleFocusOut(instance, component) {
      if (this.onFocusOut) instance.invoke("onFocusOut", instance, component);

      if (this.dismissOnFocusOut && instance.dismiss) instance.dismiss();
   }

   handleKeyDown(e, instance, component) {
      return this.onKeyDown && instance.invoke("onKeyDown", e, instance, component);
   }

   handleMouseLeave(instance, component) {
      if (this.onMouseLeave) instance.invoke("onMouseLeave", instance, component);
   }

   handleMouseEnter(instance, component) {
      if (this.onMouseEnter) instance.invoke("onMouseEnter", instance, component);
   }

   containerFactory() {
      let el = document.createElement("div");
      document.body.appendChild(el);
      el.style.position = "absolute";
      if (this.containerStyle) Object.assign(el.style, parseStyle(this.containerStyle));
      return el;
   }

   open(storeOrInstance, options) {
      if (!this.initialized) this.init();

      let el = this.containerFactory();
      el.style.display = "hidden";

      let beforeDismiss, stop;

      options = {
         destroyDelay: this.destroyDelay,
         removeParentDOMElement: true,
         ...options,
         parentEl: el,
         dismiss: () => {
            if (beforeDismiss && beforeDismiss() === false) return;
            stop();
            beforeDismiss = null;
         },
         subscribeToBeforeDismiss: (cb) => {
            beforeDismiss = cb;
         },
      };
      options.name = options.name || "overlay";
      stop = startAppLoop(el, storeOrInstance, this, options);
      return options.dismiss;
   }

   handleMove(e, instance, component) {
      let { widget } = instance;
      if (!widget.onMove || instance.invoke("onMove", e, instance, component) !== false) {
         instance.store.silently(() => {
            if (isObject(this.style) && isObject(this.style.top) && this.style.top.bind) {
               instance.store.set(this.style.top.bind, component.el.style.top);
            }

            if (isObject(this.style) && isObject(this.style.left) && this.style.left.bind) {
               instance.store.set(this.style.left.bind, component.el.style.left);
            }
         });
      }
   }

   handleResize(e, instance, component) {
      let { widget } = instance;
      if (!widget.onResize || instance.invoke("onResize", e, instance, component) !== false) {
         instance.store.silently(() => {
            if (isObject(this.style) && isObject(this.style.width) && this.style.width.bind) {
               instance.store.set(this.style.width.bind, component.el.style.width);
            }

            if (isObject(this.style) && isObject(this.style.height) && this.style.height.bind) {
               instance.store.set(this.style.height.bind, component.el.style.height);
            }
         });
      }
   }
}

Overlay.prototype.styled = true;
Overlay.prototype.baseClass = "overlay";
Overlay.prototype.resizable = false;
Overlay.prototype.resizeWidth = 7;
Overlay.prototype.center = false;
Overlay.prototype.modal = false;
Overlay.prototype.backdrop = false;
Overlay.prototype.inline = false;
Overlay.prototype.autoFocus = false;
Overlay.prototype.autoFocusFirstChild = false;
Overlay.prototype.animate = false;
Overlay.prototype.draggable = false;
Overlay.prototype.destroyDelay = 0;
Overlay.prototype.dismissOnFocusOut = false;
Overlay.prototype.focusable = false;
Overlay.prototype.containerStyle = null;
Overlay.prototype.dismissOnPopState = false;

Widget.alias("overlay", Overlay);

//TODO: all el related logic should be moved here
class OverlayContent extends VDOM.Component {
   render() {
      return (
         <div
            ref={this.props.onRef}
            className={this.props.className}
            style={this.props.style}
            tabIndex={this.props.tabIndex}
            onFocus={this.props.onFocus}
            onBlur={this.props.onBlur}
            onKeyDown={this.props.onKeyDown}
            onMouseMove={this.props.onMouseMove}
            onMouseUp={this.props.onMouseUp}
            onMouseDown={this.props.onMouseDown}
            onTouchStart={this.props.onTouchStart}
            onTouchEnd={this.props.onTouchEnd}
            onTouchMove={this.props.onTouchMove}
            onMouseEnter={this.props.onMouseEnter}
            onMouseLeave={this.props.onMouseLeave}
            onClick={this.props.onClick}
         >
            {this.props.children}
         </div>
      );
   }

   componentDidUpdate() {
      this.props.onDidUpdate();
   }
}

//TODO: This should be called OverlayPortal
export class OverlayComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      this.state = {};
      this.customStyle = {};
   }

   render() {
      let { instance, parentEl } = this.props;
      let { widget } = instance;

      if (widget.inline || parentEl) return this.renderOverlay();

      if (!this.containerEl) {
         this.ownedEl = widget.containerFactory();
         this.ownedEl.style.display = "hidden";
         this.containerEl = this.ownedEl;
      }

      if (VDOM.DOM.createPortal) return VDOM.DOM.createPortal(this.renderOverlay(), this.containerEl);

      //rendered in componentDidUpdate if portals are not supported
      return null;
   }

   renderOverlay() {
      let { widget, data } = this.props.instance;
      let { CSS, baseClass } = widget;

      if (!this.onOverlayRef)
         this.onOverlayRef = (el) => {
            this.el = el;
         };

      let content = (
         <OverlayContent
            onRef={this.onOverlayRef}
            className={data.classNames}
            style={data.style}
            tabIndex={widget.focusable ? 0 : null}
            onFocus={this.onFocus.bind(this)}
            onBlur={this.onBlur.bind(this)}
            onKeyDown={this.onKeyDown.bind(this)}
            onMouseDown={this.onMouseDown.bind(this)}
            onMouseUp={this.onMouseUp.bind(this)}
            onMouseMove={this.onMouseMove.bind(this)}
            onTouchStart={this.onMouseDown.bind(this)}
            onTouchEnd={this.onMouseUp.bind(this)}
            onTouchMove={this.onMouseMove.bind(this)}
            onMouseLeave={this.onMouseLeave.bind(this)}
            onMouseEnter={this.onMouseEnter.bind(this)}
            onClick={this.onClick.bind(this)}
            onDidUpdate={this.overlayDidUpdate.bind(this)}
         >
            {widget.modal ||
               (widget.backdrop && (
                  <div
                     key="backdrop"
                     className={CSS.element(baseClass, "modal-backdrop")}
                     onClick={this.onBackdropClick.bind(this)}
                  />
               ))}
            {this.renderOverlayBody()}
         </OverlayContent>
      );

      let result = content;

      if (widget.modal || widget.backdrop) {
         result = (
            <div
               key="shadow"
               ref={(el) => {
                  this.shadowEl = el;
               }}
               className={CSS.element(baseClass, "shadow", {
                  animated: this.state.animated,
                  "animate-enter": this.state.animated && !this.dismissed,
                  animate: widget.animate,
               })}
               style={parseStyle(data.shadowStyle)}
            >
               {content}
            </div>
         );
      }

      return result;
   }

   renderOverlayBody() {
      return this.props.children;
   }

   onFocus() {
      FocusManager.nudge();
      this.onFocusIn();
      if (this.el) oneFocusOut(this, this.el, this.onFocusOut.bind(this));
   }

   onBlur() {
      FocusManager.nudge();
   }

   onFocusIn() {}

   onFocusOut() {
      let { widget } = this.props.instance;
      widget.handleFocusOut(this.props.instance, this);
   }

   onMouseEnter(e) {
      let { widget } = this.props.instance;
      widget.handleMouseEnter(this.props.instance, this);
   }

   onMouseLeave(e) {
      let { widget } = this.props.instance;
      widget.handleMouseLeave(this.props.instance, this);
   }

   onClick(e) {
      let { instance } = this.props;
      let { widget } = instance;
      if (widget.onClick) instance.invoke("onClick", e, instance, this);
   }

   onKeyDown(e) {
      let { widget } = this.props.instance;
      widget.handleKeyDown(e, this.props.instance, this);
   }

   getResizePrefix(e) {
      let { widget, data } = this.props.instance;
      if (!data.resizable) return "";
      let cursor = this.getCursorPos(e);
      let bounds = getTopLevelBoundingClientRect(this.el);
      let leftMargin = cursor.clientX - bounds.left;
      let rightMargin = bounds.right - cursor.clientX;
      let topMargin = cursor.clientY - bounds.top;
      let bottomMargin = bounds.bottom - cursor.clientY;
      let prefix = "";

      if (topMargin >= 0 && topMargin < widget.resizeWidth) prefix += "n";
      else if (bottomMargin >= 0 && bottomMargin < widget.resizeWidth) prefix += "s";

      if (leftMargin >= 0 && leftMargin < widget.resizeWidth) prefix += "w";
      else if (rightMargin >= 0 && rightMargin < widget.resizeWidth) prefix += "e";
      return prefix;
   }

   onMouseDown(e) {
      let { data } = this.props.instance;
      let prefix = this.getResizePrefix(e);
      if (prefix) {
         //e.preventDefault();
         let rect = getTopLevelBoundingClientRect(this.el);
         let cursor = this.getCursorPos(e);
         let captureData = {
            prefix: prefix,
            dl: cursor.clientX - rect.left,
            dt: cursor.clientY - rect.top,
            dr: cursor.clientX - rect.right,
            db: cursor.clientY - rect.bottom,
            rect: rect,
         };
         captureMouseOrTouch(e, this.onMouseMove.bind(this), null, captureData, prefix + "-resize");
      } else if (data.draggable) {
         ddMouseDown(e);
      }
      e.stopPropagation();
   }

   onBackdropClick(e) {
      e.stopPropagation();
      let { instance } = this.props;
      let { widget } = instance;

      if (widget.onBackdropClick) instance.invoke("onBackdropClick", e, instance);

      if (widget.backdrop) {
         if (instance.dismiss) instance.dismiss();
      }
   }

   onMouseUp(e) {
      ddMouseUp();
      e.stopPropagation();
   }

   onMouseMove(e, captureData) {
      // handle dragging
      let { instance } = this.props;
      let { data, widget } = instance;
      let detect = ddDetect(e);
      if (data.draggable && detect) {
         this.startMoveOperation(e);
         return;
      }

      if (captureData && captureData.prefix) {
         let { prefix, rect, dl, dt, dr, db } = captureData;
         let cursor = this.getCursorPos(e);

         if (prefix.indexOf("w") != -1)
            this.setCustomStyle({
               left: cursor.clientX - dl + "px",
               width: rect.right - cursor.clientX + dl + "px",
               right: "auto",
            });

         if (prefix.indexOf("n") != -1)
            this.setCustomStyle({
               top: cursor.clientY - dt + "px",
               height: rect.bottom - cursor.clientY + dt + "px",
               bottom: "auto",
            });

         if (prefix.indexOf("e") != -1)
            this.setCustomStyle({
               width: cursor.clientX - dr - rect.left + "px",
               left: `${rect.left}px`,
               right: "auto",
            });

         if (prefix.indexOf("s") != -1)
            this.setCustomStyle({
               height: cursor.clientY - db - rect.top + "px",
               top: `${rect.top}px`,
               bottom: "auto",
            });

         if (prefix.indexOf("w") >= 0 || prefix.indexOf("n") >= 0) widget.handleMove(e, instance, this);

         widget.handleResize(e, instance, this);
      } else {
         let prefix = this.getResizePrefix(e);
         this.setCustomStyle({
            cursor: prefix ? prefix + "-resize" : null,
         });
      }
   }

   getCursorPos(e) {
      let x = (e.touches && e.touches[0]) || e;
      return {
         clientX: x.clientX,
         clientY: x.clientY,
      };
   }

   startMoveOperation(e) {
      if (this.el && !this.getResizePrefix(e)) {
         e.stopPropagation();
         let rect = getTopLevelBoundingClientRect(this.el);
         let cursor = this.getCursorPos(e);
         let data = {
            dx: cursor.clientX - rect.left,
            dy: cursor.clientY - rect.top,
         };

         captureMouseOrTouch(e, this.onMove.bind(this), null, data, getComputedStyle(e.target).cursor);
      }
   }

   onMove(e, data) {
      if (data) {
         let cursor = this.getCursorPos(e);
         e.preventDefault();
         this.setCustomStyle({
            left: cursor.clientX - data.dx + "px",
            top: cursor.clientY - data.dy + "px",
            right: "auto",
            bottom: "auto",
         });

         let { instance } = this.props;
         let { widget } = instance;
         widget.handleMove(e, instance, this);
      }
   }

   onBeforeDismiss() {
      let { instance } = this.props;
      let { widget } = instance;

      if (widget.overlayWillDismiss && widget.overlayWillDismiss(instance, this) === false) return false;

      this.dismissed = true;

      //this.el might be null if visible is set to false
      if (this.el) {
         this.el.className = this.getOverlayCssClass();

         // if (widget.animate)
         //    this.setState({
         //       animated: false
         //    });
      }
      return true;
   }

   componentDidMount() {
      let { instance, subscribeToBeforeDismiss, parentEl } = this.props;
      let { widget } = instance;

      this.setZIndex(ZIndexManager.next());

      this.componentDidUpdate();
      widget.overlayDidMount(instance, this);

      if (this.containerEl) this.containerEl.style.display = null;
      else if (parentEl) parentEl.style.display = null;

      let childHasFocus = isSelfOrDescendant(this.el, document.activeElement);

      if (childHasFocus) oneFocusOut(this, this.el, this.onFocusOut.bind(this));
      else {
         if (!widget.autoFocusFirstChild || !FocusManager.focusFirstChild(this.el))
            if (widget.focusable && widget.autoFocus) FocusManager.focus(this.el);
      }

      instance.onBeforeDismiss = this.onBeforeDismiss.bind(this);

      if (subscribeToBeforeDismiss) {
         subscribeToBeforeDismiss(instance.onBeforeDismiss);
      }

      if (widget.animate) {
         setTimeout(() => {
            if (!this.unmounting)
               this.setState({
                  animated: true,
               });
         }, 0);
      }

      if (widget.dismissOnPopState) {
         this.onPopState = () => {
            this.props.instance.dismiss();
         };
         window.addEventListener("popstate", this.onPopState);
      }

      if (this.shadowEl)
         this.unsubscribeWheelBlock = addEventListenerWithOptions(
            this.shadowEl,
            "wheel",
            (e) => {
               if (e.deltaY == 0) return;
               //check if there is a scrollable element within the shadow or overlay contents
               //such that its scrollbar is not at the very end
               let scrollAllowed = false;
               closest(e.target, (el) => {
                  if (
                     (e.deltaY > 0 && el.scrollTop < el.scrollHeight - el.clientHeight) ||
                     (e.deltaY < 0 && el.scrollTop > 0)
                  ) {
                     scrollAllowed = true;
                     return true;
                  }
                  if (el == e.currentTarget) return true;
               });
               if (!scrollAllowed) e.preventDefault();
            },
            { passive: false }
         );
   }

   componentWillUnmount() {
      if (this.onPopState) window.removeEventListener("popstate", this.onPopState);

      if (this.unsubscribeWheelBlock) this.unsubscribeWheelBlock();

      offFocusOut(this);
      this.unmounting = true;

      let { widget } = this.props.instance;
      let { baseClass, CSS } = widget;

      // //we didn't have a chance to call onBeforeDismiss
      if (this.state.animated && this.el) {
         this.el.className = this.getOverlayCssClass();
         if (this.shadowEl)
            this.shadowEl.className = CSS.element(baseClass, "shadow", {
               animate: widget.animate,
               "animate-leave": true,
            });
      }

      widget.overlayWillUnmount(this.props.instance, this);

      if (this.ownedEl) {
         setTimeout(() => {
            if (this.ownedEl.parentNode) this.ownedEl.parentNode.removeChild(this.ownedEl);
            this.ownedEl = null;
         }, widget.destroyDelay);
      }

      delete this.containerEl;
   }

   setZIndex(zIndex) {
      if (this.shadowEl) this.shadowEl.style.zIndex = zIndex;
      this.setCustomStyle({
         zIndex: zIndex,
      });
   }

   setCustomStyle(style) {
      Object.assign(this.customStyle, style);
      if (this.el) Object.assign(this.el.style, this.customStyle);
   }

   getOverlayStyle() {
      let { data } = this.props.instance;
      return {
         ...data.style,
         ...this.customStyle,
      };
   }

   setCSSState(mods) {
      let m = { ...this.state.mods };
      let changed = false;
      for (let k in mods)
         if (m[k] !== mods[k]) {
            m[k] = mods[k];
            changed = true;
         }

      if (changed)
         this.setState({
            mods: mods,
         });
   }

   getOverlayCssClass() {
      let { data, widget } = this.props.instance;
      let { CSS } = widget;

      return CSS.expand(
         data.classNames,
         CSS.state({
            ...this.state.mods,
            animated: this.state.animated && !this.unmounting && !this.dismissed,
            "animate-enter": this.state.animated && !this.dismissed,
            "animate-leave": widget.animate && this.dismissed,
         })
      );
   }

   overlayDidUpdate() {
      if (this.el && !this.dismissed) {
         let { widget } = this.props.instance;
         widget.overlayDidUpdate(this.props.instance, this);
         this.el.className = this.getOverlayCssClass();
         Object.assign(this.el.style, this.getOverlayStyle());
      }
   }

   componentDidUpdate() {
      if (this.containerEl && !VDOM.DOM.createPortal) {
         VDOM.DOM.render(this.renderOverlay(), this.containerEl);
      }
      this.overlayDidUpdate();
   }
}
