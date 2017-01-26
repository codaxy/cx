import {Binding} from './Binding';
import {View} from './View';

export class Store extends View {
   constructor(config = {}) {
      super();
      this.data = config.data || {};
      this.subscriptions = {};
      this.subscriptionKey = 0;
      this.changes = [];
      this.meta = {
         version: 0
      }
   }

   getData() {
      return this.data;
   }

   setItem(path, value) {
      var next = Binding.get(path).set(this.data, value);
      if (next != this.data) {
         this.data = next;
         this.meta.version++;
         this.notify(path);
      }
   }
   
   deleteItem(path) {
      var next = Binding.get(path).delete(this.data);
      if (next != this.data) {
         this.data = next;
         this.meta.version++;
         this.notify(path);
      }
   }
   
   clear() {
      this.data = {};
      this.meta.version++;
      this.notify();
   }

   subscribe(callback) {
      var key = ++this.subscriptionKey;
      this.subscriptions[key] = callback;
      return () => delete this.subscriptions[key];
   }

   unsubscribeAll() {
      this.subscriptions = {};
   }

   doNotify(path) {
      if (!this.async) {
         for (let key in this.subscriptions)
            this.subscriptions[key]([path]);
      } else {
         this.changes.push(path || '');
         if (!this.scheduled) {
            this.scheduled = true;
            setTimeout(() => {
               this.scheduled = false;
               let changes = this.changes;
               this.changes = [];
               for (let key in this.subscriptions)
                  this.subscriptions[key](changes);
            }, 0);
         }
      }
   }
}

Store.prototype.async = false;
