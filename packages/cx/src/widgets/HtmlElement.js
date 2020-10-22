import { Widget, VDOM } from "../ui/Widget";
import { Container } from "../ui/Container";
import {
   tooltipMouseMove,
   tooltipParentWillUnmount,
   tooltipMouseLeave,
   tooltipParentWillReceiveProps,
   tooltipParentDidMount,
} from "./overlay/tooltip-ops";
import { Url } from "../ui/app/Url";
import { debug } from "../util/Debug";
import { isString } from "../util/isString";
import { isUndefined } from "../util/isUndefined";
import { isDefined } from "../util/isDefined";
import { isArray } from "../util/isArray";

let isDataAttribute = (attr) => (attr.indexOf("data-") == 0 ? attr.substring(5) : false);

export let urlAttributes = {
   "a.href": true,
   "img.src": true,
   "iframe.src": true,
};

export class HtmlElement extends Container {
   constructor(config) {
      super(config);

      if (isUndefined(this.jsxAttributes) && config)
         this.jsxAttributes = Object.keys(config).filter(this.isValidHtmlAttribute.bind(this));
   }

   declareData() {
      let data = {
         text: undefined,
         innerHtml: undefined,
         attrs: {
            structured: true,
         },
         data: {
            structured: true,
         },
      };

      let name;

      this.urlAttributes = [];

      if (this.jsxAttributes) {
         this.jsxAttributes.forEach((attr) => {
            if (urlAttributes[`${this.tag}.${attr}`]) this.urlAttributes.push(attr);

            if ((name = isDataAttribute(attr))) {
               if (!this.data) this.data = {};
               this.data[name] = this[attr];
            } else if ((name = this.isValidHtmlAttribute(attr)) && !data.hasOwnProperty(name)) {
               if (name.indexOf("on") == 0) {
                  if (this[attr]) {
                     if (!this.events) this.events = {};
                     this.events[name] = this[attr];
                  }
               } else {
                  if (!this.attrs) this.attrs = {};
                  this.attrs[name] = this[attr];
               }
            }
         });
      }

      if (this.urlAttributes.length == 0) delete this.urlAttributes;

      super.declareData(...arguments, data);
   }

   isValidHtmlAttribute(attrName) {
      switch (attrName) {
         case "tag":
         case "type":
         case "$type":
         case "$props":
         case "text":
         case "layout":
         case "class":
         case "className":
         case "style":
         case "controller":
         case "outerLayout":
         case "items":
         case "children":
         case "visible":
         case "if":
         case "mod":
         case "putInto":
         case "contentFor":
         case "trimWhitespace":
         case "preserveWhitespace":
         case "ws":
         case "plainText":
         case "vertical":
         case "memoize":
         case "onInit":
         case "onExplore":
         case "onDestroy":
         case "html":
         case "innerText":
         case "baseClass":
         case "CSS":
         case "tooltip":
         case "styles":
         case "jsxAttributes":
         case "jsxSpread":
         case "instance":
         case "store":
            return false;

         default:
            if (isDataAttribute(attrName)) return false;

            break;
      }

      return attrName;
   }

   init() {
      if (this.html) this.innerHtml = this.html;

      if (this.innerText) this.text = this.innerText;

      super.init();
   }

   prepareData(context, instance) {
      let { data } = instance;
      if (this.urlAttributes && data.attrs) {
         data.attrs = { ...data.attrs };
         this.urlAttributes.forEach((attr) => {
            if (isString(data.attrs[attr])) data.attrs[attr] = Url.resolve(data.attrs[attr]);
         });
      }
      super.prepareData(context, instance);
   }

   attachProps(context, instance, props) {
      Object.assign(props, this.extraProps);

      if (!isString(this.tag)) props.instance = instance;
   }

   render(context, instance, key) {
      //rebind events to pass instance
      if (this.events && !instance.events) {
         instance.events = {};
         for (let eventName in this.events) {
            instance.events[eventName] = (e) => instance.invoke(eventName, e, instance);
         }
      }

      let { data, events } = instance;

      let props = Object.assign(
         {
            key: key,
         },
         data.attrs,
         events
      );

      if (data.classNames) props.className = data.classNames;

      if (data.style) props.style = data.style;

      let children;
      if (isDefined(data.text)) children = data.text;
      else if (isString(data.innerHtml)) {
         props.dangerouslySetInnerHTML = { __html: data.innerHtml };
      } else {
         children = this.renderChildren(context, instance);
         if (children && isArray(children) && children.length == 0) children = undefined;
      }

      props.children = children;

      this.attachProps(context, instance, props);

      if (this.tooltip)
         return (
            <ContainerComponent key={key} tag={this.tag} props={props} instance={instance} data={data}>
               {props.children}
            </ContainerComponent>
         );

      return VDOM.createElement(this.tag, props, props.children);
   }
}

HtmlElement.prototype.tag = "div";
HtmlElement.prototype.styled = true;

class ContainerComponent extends VDOM.Component {
   render() {
      let { tag, props, children, instance } = this.props;

      if (instance.widget.tooltip) {
         props.ref = (c) => {
            this.el = c;
         };

         let { onMouseLeave, onMouseMove } = props;

         props.onMouseLeave = (e) => {
            tooltipMouseLeave(e, instance, instance.widget.tooltip);
            if (onMouseLeave) onMouseLeave(e);
         };
         props.onMouseMove = (e) => {
            tooltipMouseMove(e, instance, instance.widget.tooltip);
            if (onMouseMove) onMouseMove(e);
         };
      }

      return VDOM.createElement(tag, props, children);
   }

   componentWillUnmount() {
      tooltipParentWillUnmount(this.props.instance);
   }

   UNSAFE_componentWillReceiveProps(props) {
      tooltipParentWillReceiveProps(this.el, props.instance, this.props.instance.widget.tooltip);
   }
   componentDidMount() {
      tooltipParentDidMount(this.el, this.props.instance, this.props.instance.widget.tooltip);
   }
}

let originalWidgetFactory = Widget.factory;

//support for React components
Widget.factory = function (type, config, more) {
   let typeType = typeof type;

   if (typeType == "undefined") {
      debug("Creating a widget of unknown type.", config, more);
      return new HtmlElement(Object.assign({}, config, more));
   }

   if (typeType == "function") return HtmlElement.create(HtmlElement, { tag: type }, config);

   return originalWidgetFactory.call(Widget, type, config, more);
};

Widget.alias("html-element", HtmlElement);
