import {Widget} from './Widget';
import {StaticText} from './StaticText';
import {Layout} from './layout/Layout';
import {Text} from './Text';
import {innerTextTrim} from '../util/innerTextTrim';
import {parseStyle} from '../util/parseStyle';
import {isString} from '../util/isString';
import {isArray} from '../util/isArray';

export class PureContainer extends Widget {

   init() {
      if (typeof this.ws !== 'undefined')
         this.preserveWhitespace = this.ws;

      if (this.preserveWhitespace)
         this.trimWhitespace = false;

      if (this.styles)
         this.style = this.styles;

      if (this.styled)
         this.style = parseStyle(this.style);

      let items = this.items || this.children || [];
      this.items = [];
      this.add(items);
      
      super.init();

      this.layout = Layout.create(this.layout || 'default');
   }

   declareData() {
      let options = {};

      if (this.styled)
         options.class = options.className = options.style = {structured: true};

      super.declareData(...arguments, options);
   }

   explore(context, instance) {
      this.layout.explore(context, instance, this.items);
      super.explore(context, instance);
   }

   prepare(context, instance) {
      this.layout.prepare(context, instance);
      super.prepare(context, instance);
   }

   render(context, instance, key) {
      return this.renderChildren(context, instance, key);
   }

   cleanup(context, instance) {
      this.layout.cleanup(context, instance)
      super.cleanup(context, instance);
   }

   renderChildren(context, instance, keyPrefix) {
      return this.layout.render(context, instance, keyPrefix)
   }

   clear() {
      this.items = [];
   }

   add(...args) {
      args.forEach(a => {
         if (!a)
            return;
         if (isArray(a))
            a.forEach(c=>this.add(c));
         else if (isString(a)) {
            if (this.trimWhitespace)
               a = innerTextTrim(a);
            if (a)
               this.addText(a);
         } else if (a.isComponent)
            this.items.push(a);
         else
            this.add(Widget.create(a, this.itemDefaults));
      });
   }

   addText(text) {
      if (this.plainText || text.indexOf('{') == -1 || text.indexOf('}') == -1)
         this.items.push(Widget.create(StaticText, {text: text}));
      else
         this.items.push(Widget.create(Text, {text: {tpl: text}}));
   }

   find(filter, options) {

      if (!options)
         options = {};

      if (!filter || !this.items)
         return [];

      var alias = filter;

      if (isString(filter))
         filter = (w) => w.componentAlias == alias;

      if (filter.isComponentType)
         filter = (w) => w instanceof alias;

      var results = [];

      for (var i = 0; i < this.items.length; i++) {
         var w = this.items[i];

         if (!w.initialized)
            w.init();

         if (filter(w)) {
            results.push(w);
            if (options.first)
               break;
         }

         if (w.find)
            results.push(...w.find(filter, options))
      }

      return results;
   }

   findFirst(filter, options) {
      return this.find(filter, {...options, first: true})[0];
   }
}

PureContainer.prototype.trimWhitespace = true;
PureContainer.prototype.plainText = true;
PureContainer.prototype.styled = false;

Widget.alias('pure-container', PureContainer);
