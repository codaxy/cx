import {Widget, VDOM} from '../Widget';
import {PureContainer} from '../PureContainer';
import {startAppLoop} from '../../app/startAppLoop';
import {FocusManager, oneFocusOut, offFocusOut} from '../FocusManager';
import {isSelfOrDescendant} from '../../util/DOM';
import {getViewportSize} from '../../util/getViewportSize';
import {captureMouseOrTouch} from './captureMouse';

/*
 Features:
 - renders itself on top of other elements
 - provide resizing capabilities
 - adds positioning hook and ability to position itself in the center of the page
 - provides header, body, and footer elements and updates body's height on resize (move this to Window)
 - stop mouse events from bubbling to parents, but allow keystrokes
 */

export class Overlay extends PureContainer {
   declareData() {
      return super.declareData(...arguments, {
         style: {
            structured: true
         },
         class: {
            structured: true
         },
         className: {
            structured: true
         },
         resizable: undefined,
         draggable: undefined
      });
   }

   prepareData(context, instance) {
      var {data, store} = instance;
      data.stateMods = {
         ...data.stateMods,
         inline: this.inline,
         modal: this.modal,
         resizable: data.resizable,
         draggable: data.draggable
      };

      if (context.options.dismiss)
         instance.dismiss = context.options.dismiss;
      else if (this.visible && this.visible.bind) {
         instance.dismiss = () => {
            store.set(this.visible.bind, false)
         };
      }

      super.prepareData(context, instance);
   }

   explore(context, instance) {
      var oldParentOptions = context.parentOptions;
      if (instance.dismiss)
         context.parentOptions = {
            ...context.parentOptions,
            dismiss: instance.dismiss
         };

      super.explore(context, instance);
      context.parentOptions = oldParentOptions;
   }

   render(context, instance, key) {
      return <OverlayComponent key={key}
                               instance={instance}
                               subscribeToBeforeDismiss={context.options.subscribeToBeforeDismiss}
                               parentEl={context.options.parentEl}>
         {this.renderContents(context, instance)}
      </OverlayComponent>
   }

   renderContents(context, instance) {
      return this.renderChildren(context, instance);
   }

   overlayDidMount(instance, component) {
      if (this.center) {
         var {el} = component;
         var rect = el.getBoundingClientRect();
         el.style.left = `${(window.innerWidth - rect.width) / 2}px`;
         el.style.top = `${(window.innerHeight - rect.height) / 2}px`;
      }
   }

   overlayDidUpdate(instance, component) {

   }

   overlayWillUnmount(instance, component) {

   }

   handleFocusOut(instance, component) {
      if (this.onFocusOut)
         this.onFocusOut(instance, component);

      if (this.dismissOnFocusOut && instance.dismiss)
         instance.dismiss();
   }

   handleKeyDown(e, instance, component) {
      if (this.onKeyDown)
         this.onKeyDown(e, instance, component);
   }

   handleMouseLeave(instance, component) {
      if (this.onMouseLeave)
         this.onMouseLeave(instance, component);
   }

   handleMouseEnter(instance, component) {
      if (this.onMouseEnter)
         this.onMouseEnter(instance, component);
   }

   open(store, options) {
      if (!this.initialized)
         this.init();

      var el = document.createElement('div');
      document.body.appendChild(el);
      el.style.display = "hidden";
      options = {
         ...options,
         parentEl: el
      };
      options.name = options.name || 'overlay';
      var stop, beforeDismiss, dismissed;
      options.subscribeToBeforeDismiss = function (callback) {
         beforeDismiss = callback;
      };
      var dismiss = options.dismiss = () => {
         if (dismissed)
            return;
         if (beforeDismiss && beforeDismiss() === false)
            return;
         dismissed = true;
         stop();
         if (el) {
            setTimeout(() => {
               if (VDOM.DOM.unmountComponentAtNode)
                  VDOM.DOM.unmountComponentAtNode(el);
               document.body.removeChild(el);
               el = null;
            }, this.destroyDelay);
         }
      };
      stop = startAppLoop(el, store, this, options);
      return dismiss;
   }
}

Overlay.prototype.baseClass = 'overlay';
Overlay.prototype.resizable = false;
Overlay.prototype.resizeWidth = 7;
Overlay.prototype.center = false;
Overlay.prototype.modal = false;
Overlay.prototype.backdrop = false;
Overlay.prototype.inline = false;
Overlay.prototype.autoFocus = false;
Overlay.prototype.animate = false;
Overlay.prototype.draggable = false;
Overlay.prototype.destroyDelay = 0;
Overlay.prototype.dismissOnFocusOut = false;
Overlay.prototype.focusable = false;

Widget.alias('overlay', Overlay);

export class OverlayComponent extends VDOM.Component {

   constructor(props) {
      super(props);
      this.state = {};
      this.customStyle = {};
   }

   render() {
      var {instance, parentEl} = this.props;
      var {widget} = instance;

      if (widget.inline || parentEl)
         return this.renderOverlay();

      return null;
   }

   renderOverlay() {

      let {widget, data} = this.props.instance;
      let {CSS, baseClass} = widget;

      let content = (
         <div
            ref={el => {
               this.el = el
            }}
            className={data.classNames}
            style={data.style}
            tabIndex={widget.focusable ? 0 : null}
            onFocus={::this.onFocus}
            onBlur={::this.onBlur}
            onKeyDown={::this.onKeyDown}
            onMouseMove={::this.onMouseMove}
            onMouseUp={::this.onMouseUp}
            onMouseDown={::this.onMouseDown}
            onTouchStart={::this.onMouseDown}
            onMouseEnter={::this.onMouseEnter}
            onMouseLeave={::this.onMouseLeave}
         >
            { widget.modal || widget.backdrop && <div key="backdrop" className={CSS.element(baseClass, 'modal-backdrop')} onClick={::this.onBackdropClick} /> }
            {this.renderOverlayBody()}
         </div>
      );

      let result = content;

      if (widget.modal || widget.backdrop) {
         result = (
            <div className={CSS.element(baseClass, 'shadow')} key="shadow">
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
      if (this.el)
         oneFocusOut(this, this.el, ::this.onFocusOut);
   }

   onBlur() {
      FocusManager.nudge();
   }

   onFocusIn() {
   }

   onFocusOut() {
      var {widget} = this.props.instance;
      widget.handleFocusOut(this.props.instance, this);
   }

   onMouseEnter(e) {
      var {widget} = this.props.instance;
      widget.handleMouseEnter(this.props.instance, this);
   }

   onMouseLeave(e) {
      var {widget} = this.props.instance;
      widget.handleMouseLeave(this.props.instance, this);
   }

   onKeyDown(e) {
      var {widget} = this.props.instance;
      widget.handleKeyDown(e, this.props.instance, this);
   }

   getResizePrefix(e) {
      var {widget, data} = this.props.instance;
      if (!data.resizable)
         return '';
      var cursor = this.getCursorPos(e);
      var bounds = this.el.getBoundingClientRect();
      var leftMargin = cursor.clientX - bounds.left;
      var rightMargin = bounds.right - cursor.clientX;
      var topMargin = cursor.clientY - bounds.top;
      var bottomMargin = bounds.bottom - cursor.clientY;
      var prefix = '';

      if (topMargin >= 0 && topMargin < widget.resizeWidth)
         prefix += 'n';
      else if (bottomMargin >= 0 && bottomMargin < widget.resizeWidth)
         prefix += 's';

      if (leftMargin >= 0 && leftMargin < widget.resizeWidth)
         prefix += 'w';
      else if (rightMargin >= 0 && rightMargin < widget.resizeWidth)
         prefix += 'e';
      return prefix;
   }

   onMouseDown(e) {
      var {data} = this.props.instance;
      var prefix = this.getResizePrefix(e);
      if (prefix) {
         //e.preventDefault();
         e.stopPropagation();
         var rect = this.el.getBoundingClientRect();
         var cursor = this.getCursorPos(e);
         var captureData = {
            prefix: prefix,
            dl: cursor.clientX - rect.left,
            dt: cursor.clientY - rect.top,
            dr: cursor.clientX - rect.right,
            db: cursor.clientY - rect.bottom,
            rect: rect
         };
         captureMouseOrTouch(e, ::this.onMouseMove, null, captureData, prefix + '-resize');
      }
      else if (data.draggable) {
         this.startMoveOperation(e);
         e.stopPropagation();
      }

      e.stopPropagation();
   }

   onBackdropClick(e) {
      e.stopPropagation();
      var {instance} = this.props;
      var {widget} = instance;

      if (widget.onBackdropClick)
         widget.onBackdropClick(e, instance);

      if (widget.backdrop) {
         if (instance.dismiss)
            instance.dismiss();
      }
   }

   onMouseUp(e) {
      e.stopPropagation();
   }

   onMouseMove(e, captureData) {
      if (captureData) {
         var {prefix, rect, dl, dt, dr, db} = captureData;
         var cursor = this.getCursorPos(e);

         if (prefix.indexOf('w') != -1)
            this.setCustomStyle({
               left: (cursor.clientX - dl) + 'px',
               width: (rect.right - cursor.clientX + dl) + 'px',
               right: 'auto'
            });

         if (prefix.indexOf('n') != -1)
            this.setCustomStyle({
               top: (cursor.clientY - dt) + 'px',
               height: (rect.bottom - cursor.clientY + dt) + 'px',
               bottom: 'auto'
            });

         if (prefix.indexOf('e') != -1)
            this.setCustomStyle({
               width: (cursor.clientX - dr - rect.left) + 'px',
               left: `${rect.left}px`,
               right: 'auto'
            });

         if (prefix.indexOf('s') != -1)
            this.setCustomStyle({
               height: (cursor.clientY - db - rect.top) + 'px',
               top: `${rect.top}px`,
               bottom: 'auto'
            });
      }
      else {
         var prefix = this.getResizePrefix(e);
         this.setCustomStyle({
            cursor: prefix ? prefix + '-resize' : null
         });
      }
   }

   getCursorPos(e) {
      return (e.touches && e.touches[0]) || {clientX: e.clientX, clientY: e.clientY};
   }

   startMoveOperation(e) {
      if (this.el && !this.getResizePrefix(e)) {
         e.stopPropagation();
         var rect = this.el.getBoundingClientRect();
         var cursor = this.getCursorPos(e);
         var data = {
            dx: cursor.clientX - rect.left,
            dy: cursor.clientY - rect.top
         };

         captureMouseOrTouch(e, ::this.onMove, null, data, getComputedStyle(e.target).cursor);
      }
   }

   onMove(e, data) {
      if (data) {
         var cursor = this.getCursorPos(e);
         e.preventDefault();
         this.setCustomStyle({
            left: (cursor.clientX - data.dx) + 'px',
            top: (cursor.clientY - data.dy) + 'px',
            right: 'auto',
            bottom: 'auto'
         });
      }
   }

   componentDidMount() {
      var {instance, subscribeToBeforeDismiss, parentEl} = this.props;
      var {widget} = instance;
      if (!parentEl && !widget.inline) {
         this.ownedEl = document.createElement('div');
         this.ownedEl.style.display = 'hidden';
         this.containerEl = this.ownedEl;
         document.body.appendChild(this.ownedEl);
      }

      this.componentDidUpdate();

      widget.overlayDidMount(instance, this);

      if (this.containerEl)
         this.containerEl.style.display = null;
      else if (parentEl)
         parentEl.style.display = null;

      if (widget.autoFocus)
         FocusManager.focusFirst(this.el);
      else if (isSelfOrDescendant(this.el, document.activeElement))
         oneFocusOut(this, this.el, ::this.onFocusOut);

      if (subscribeToBeforeDismiss) {
         subscribeToBeforeDismiss(() => {
            if (widget.animate)
               this.setState({
                  animated: false
               });
         });
      }

      if (widget.animate) {
         this.setState({
            animated: true
         });
      }
   }

   componentWillUnmount() {

      offFocusOut(this);

      var {widget} = this.props.instance;

      widget.overlayWillUnmount(this.props.instance, this);

      if (this.ownedEl) {
         setTimeout(() => {
            document.body.removeChild(this.ownedEl);
            this.ownedEl = null;
         }, 0);
      }

      delete this.containerEl;
   }

   setCustomStyle(style) {
      Object.assign(this.customStyle, style);
      if (this.el)
         Object.assign(this.el.style, this.customStyle);
   }

   getOverlayStyle() {
      var {data} = this.props.instance;
      return {
         ...data.style,
         ...this.customStyle
      }
   }

   setCSSState(mods) {
      var m = {...this.state.mods};
      var changed = false;
      for (var k in mods)
         if (m[k] !== mods[k]) {
            m[k] = mods[k];
            changed = true;
         }

      if (changed)
         this.setState({
            mods: mods
         });
   }

   getOverlayCssClass() {
      var {data, widget} = this.props.instance;
      var {CSS} = widget;

      return CSS.expand(data.classNames, CSS.state({
         ...this.state.mods,
         animated: this.state.animated
      }));
   }

   componentDidUpdate() {
      if (this.containerEl) {
         VDOM.DOM.render(this.renderOverlay(), this.containerEl);
      }
      var {widget} = this.props.instance;
      widget.overlayDidUpdate(this.props.instance, this);
      this.el.className = this.getOverlayCssClass();
      Object.assign(this.el.style, this.getOverlayStyle());
   }
}
