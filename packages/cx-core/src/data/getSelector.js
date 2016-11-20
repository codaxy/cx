import {Binding} from './Binding';
import {Expression} from './Expression';
import {StringTemplate} from './StringTemplate';

var nullF = () => null;

export function getSelector(config) {
   
   if (config == null)
      return nullF;

   switch (typeof config) {
      case 'object':

         if (Array.isArray(config)) {
            let selectors = config.map(x => getSelector(x));
            return (data) => selectors.map(elementSelector => elementSelector(data));
         }

         if (config.bind)
            return Binding.get(config.bind).value;

         if (config.tpl)
            return StringTemplate.get(config.tpl);

         if (config.expr)
            return Expression.get(config.expr);

         break;

      case 'function':
         return config;

      default:
         return () => config;
   }
}
