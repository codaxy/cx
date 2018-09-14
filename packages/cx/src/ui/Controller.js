import {computable} from '../data/computable';
import {Component} from './Component';
import {isArray} from '../util/isArray';
import {isFunction} from '../util/isFunction';

const computablePrefix = 'computable-';
const triggerPrefix = 'trigger-';

export class Controller extends Component {

   init(context) {
      if (!this.initialized) {
         this.initialized = true;
         super.init();
         if (this.onInit)
            this.onInit(context);
      }
   }

   explore(context) {
      let {store} = this.instance;
      this.store = store; //in rare cases instance may change its store

      if (!this.initialized) {
         this.init(context);
         //forgive if the developer forgets to call super.init()
         this.initialized = true;
      }

      if (this.computables) {
         for (let key in this.computables) {
            let x = this.computables[key];
            let v = x.selector(store.getData());
            if (x.type == 'computable')
               store.set(x.name, v);
         }
      }

      if (this.onExplore) {
         this.onExplore(context);
      }
   }

   prepare(context) {
      if (this.onPrepare) {
         this.onPrepare(context);
      }
   }

   cleanup(context) {
      if (this.onCleanup) {
         this.onCleanup(context);
      }
   }

   addComputable(name, args, callback) {
      if (!isArray(args))
         throw new Error('Second argument to the addComputable method should be an array.');
      let selector = computable(...args, callback).memoize();
      if (!this.computables)
         this.computables = {};
      this.computables[computablePrefix + name] = {name, selector, type: 'computable'};
   }

   addTrigger(name, args, callback, autoRun) {
      if (!isArray(args))
         throw new Error('Second argument to the addTrigger method should be an array.');
      let selector = computable(...args, callback).memoize(false, !autoRun && this.store.getData());
      if (!this.computables)
         this.computables = {};
      this.computables[triggerPrefix + name] = {name, selector, type: 'trigger'};
   }

   removeTrigger(name) {
      if (this.computables)
         delete this.computables[triggerPrefix + name];
   }

   removeComputable(name) {
      if (this.computables)
         delete this.computables[computablePrefix + name];
   }

   invokeParentMethod(methodName, ...args) {
      return this.instance.invokeControllerMethod(methodName, ...args);
   }
}

Controller.namespace = 'ui.controller.';
Controller.lazyInit = true;

Controller.factory = function(alias, config, more) {
   if (isFunction(alias)) {
      let result = alias(config);
      if (result instanceof Controller)
         return result;

      return new Controller({
         ...config,
         ...more,
         ...result
      });
   }

   return new Controller({
      ...config,
      ...more
   });
}
