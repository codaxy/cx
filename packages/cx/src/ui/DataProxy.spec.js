import { Cx } from "./Cx";
import { Store } from "../data/Store";
import { VDOM } from "./VDOM";
import renderer from "react-test-renderer";
import assert from "assert";
import { Controller } from "./Controller";
import { DataProxy } from "./DataProxy";
import { computable } from "../data/computable";
import { HtmlElement } from "../widgets/HtmlElement";
import { useState } from "../hooks";
import { createFunctionalComponent } from "./createFunctionalComponent";
import { Widget } from "./Widget";

describe("DataProxy", () => {
   it("can calculate values", () => {
      let widget = (
         <cx>
            <DataProxy
               data={{
                  $value: { bind: "value" },
               }}
            >
               <span text-bind="$value" />
            </DataProxy>
         </cx>
      );

      let store = new Store({
         data: {
            value: "good",
         },
      });

      const component = renderer.create(<Cx widget={widget} store={store} subscribe immediate />);

      let tree = component.toJSON();
      assert.deepEqual(tree, {
         type: "span",
         props: {},
         children: ["good"],
      });
   });

   it("can write into values aliased with bind", () => {
      class TestController extends Controller {
         onInit() {
            this.store.set("$value", "excellent");
         }
      }

      let widget = (
         <cx>
            <DataProxy
               data={{
                  $value: { bind: "value" },
               }}
               controller={TestController}
            >
               <span text-bind="$value" />
            </DataProxy>
         </cx>
      );

      let store = new Store({
         data: {
            value: "good",
         },
      });

      const component = renderer.create(<Cx widget={widget} store={store} subscribe immediate />);

      let tree = component.toJSON();

      assert(store.get("value"), "excellent");

      assert.deepEqual(tree, {
         type: "span",
         props: {},
         children: ["excellent"],
      });
   });

   it("can write into aliased values using provided setters", () => {
      class TestController extends Controller {
         onInit() {
            this.store.set("$value", "excellent");
         }
      }

      let widget = (
         <cx>
            <DataProxy
               data={{
                  $value: {
                     expr: computable("value", (value) => value),
                     set: (value, { store }) => {
                        store.set("value", value);
                     },
                  },
               }}
               controller={TestController}
            >
               <span text-bind="$value" />
            </DataProxy>
         </cx>
      );

      let store = new Store({
         data: {
            value: "good",
         },
      });

      const component = renderer.create(<Cx widget={widget} store={store} subscribe immediate />);

      let tree = component.toJSON();

      assert(store.get("value"), "excellent");

      assert.deepEqual(tree, {
         type: "span",
         props: {},
         children: ["excellent"],
      });
   });

   it("allows shorter syntax", () => {
      let widget = (
         <cx>
            <DataProxy alias="$value" value-bind="value">
               <span text-bind="$value" />
            </DataProxy>
         </cx>
      );

      let store = new Store({
         data: {
            value: "good",
         },
      });

      const component = renderer.create(<Cx widget={widget} store={store} subscribe immediate />);

      let tree = component.toJSON();
      assert.deepEqual(tree, {
         type: "span",
         props: {},
         children: ["good"],
      });
   });

   it("correctly updates aliased data after write", () => {
      class TestController extends Controller {
         onInit() {
            this.store.set("$value", "excellent");
            assert.equal(this.store.get("$value"), "excellent");
         }
      }

      let widget = (
         <cx>
            <DataProxy
               data={{
                  $value: { bind: "value" },
               }}
               controller={TestController}
            >
               <span text-bind="$value" />
            </DataProxy>
         </cx>
      );

      let store = new Store({
         data: {
            value: "good",
         },
      });

      const component = renderer.create(<Cx widget={widget} store={store} subscribe immediate />);

      let tree = component.toJSON();

      assert(store.get("value"), "excellent");

      assert.deepEqual(tree, {
         type: "span",
         props: {},
         children: ["excellent"],
      });
   });

   it("properly binds structures", () => {
      class TestController extends Controller {
         onInit() {
            this.store.set("$person.firstName", "Jim");
         }
      }

      let widget = (
         <cx>
            <DataProxy
               data={{
                  $person: { bind: "person" },
               }}
               controller={TestController}
            >
               <span text-tpl="{$person.firstName} {$person.lastName}" />
            </DataProxy>
         </cx>
      );

      let store = new Store({
         data: {
            person: { firstName: "John", lastName: "Smith" },
         },
      });

      const component = renderer.create(<Cx widget={widget} store={store} subscribe immediate />);

      let tree = component.toJSON();

      assert(store.get("person.firstName"), "Jim");

      assert.deepEqual(tree, {
         type: "span",
         props: {},
         children: ["Jim Smith"],
      });
   });

   it("works with Store refs", () => {
      let widget = createFunctionalComponent(() => {
         let valueRef = useState("a");
         return (
            <cx>
               <DataProxy
                  data={{
                     $value: valueRef,
                  }}
               >
                  <span
                     text-bind="$value"
                     controller={{
                        onInit() {
                           valueRef.set("b");
                        },
                     }}
                  />
               </DataProxy>
            </cx>
         );
      });

      let store = new Store({
         data: {
            //value: "good"
         },
      });

      const component = renderer.create(<Cx widget={widget} store={store} subscribe immediate />);

      let tree = component.toJSON();
      assert.deepEqual(tree, {
         type: "span",
         props: {},
         children: ["b"],
      });
   });

   it("controllers set on the DataProxy can see calculated values", () => {
      let value;
      let widget = Widget.create(<cx>
         <DataProxy
            data={{
               $value: 5
            }}
            controller={{
               onInit() {
                  value = this.store.get("$value")
               },
            }}
         />
      </cx>);

      let store = new Store();

      const component = renderer.create(<Cx widget={widget} store={store} subscribe immediate />);

      let tree = component.toJSON();
      assert.equal(value, 5);
   });
});
