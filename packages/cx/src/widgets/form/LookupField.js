import { Widget, VDOM, getContent } from "../../ui/Widget";
import { Cx } from "../../ui/Cx";
import { Field, getFieldTooltip, autoFocus } from "./Field";
import { Text } from "../../ui/Text";
import { ReadOnlyDataView } from "../../data/ReadOnlyDataView";
import { HtmlElement } from "../HtmlElement";
import { Binding } from "../../data/Binding";
import { debug } from "../../util/Debug";
import { Dropdown } from "../overlay/Dropdown";
import { FocusManager } from "../../ui/FocusManager";
import { isFocused } from "../../util/DOM";
import { isTouchDevice } from "../../util/isTouchDevice";
import { isTouchEvent } from "../../util/isTouchEvent";
import {
   tooltipParentWillReceiveProps,
   tooltipParentWillUnmount,
   tooltipMouseMove,
   tooltipMouseLeave,
   tooltipParentDidMount,
} from "../overlay/tooltip-ops";
import { stopPropagation, preventDefault } from "../../util/eventCallbacks";
import ClearIcon from "../icons/clear";
import DropdownIcon from "../icons/drop-down";
import { getSearchQueryPredicate } from "../../util/getSearchQueryPredicate";
import { KeyCode } from "../../util/KeyCode";
import { Localization } from "../../ui/Localization";
import { StringTemplate } from "../../data/StringTemplate";
import { Icon } from "../Icon";
import { isString } from "../../util/isString";
import { isDefined } from "../../util/isDefined";
import { isArray } from "../../util/isArray";
import { isNonEmptyArray } from "../../util/isNonEmptyArray";
import { addEventListenerWithOptions } from "../../util/addEventListenerWithOptions";
import { List } from "../List";
import { Selection } from "../../ui/selection/Selection";

export class LookupField extends Field {
   declareData() {
      let additionalAttributes = this.multiple
         ? { values: undefined, records: undefined }
         : { value: undefined, text: undefined };

      super.declareData(
         {
            disabled: undefined,
            enabled: undefined,
            placeholder: undefined,
            required: undefined,
            options: undefined,
            icon: undefined,
            autoOpen: undefined,
            readOnly: undefined,
         },
         additionalAttributes,
         ...arguments
      );
   }

   init() {
      if (isDefined(this.hideClear)) this.showClear = !this.hideClear;

      if (this.alwaysShowClear) this.showClear = true;

      if (!this.bindings) {
         let b = [];
         if (this.value && this.value.bind)
            b.push({
               key: true,
               local: this.value.bind,
               remote: `$option.${this.optionIdField}`,
               set: this.value.set,
            });

         if (this.text && this.text.bind)
            b.push({
               local: this.text.bind,
               remote: `$option.${this.optionTextField}`,
               set: this.text.set,
            });
         this.bindings = b;
      }

      if (this.bindings.length == 0 && this.multiple)
         this.bindings = [
            {
               key: true,
               local: `$value.${this.valueIdField}`,
               remote: `$option.${this.optionIdField}`,
            },
            {
               local: `$value.${this.valueTextField}`,
               remote: `$option.${this.optionTextField}`,
            },
         ];

      this.keyBindings = this.bindings.filter((b) => b.key);

      if (!this.items && !this.children)
         this.items = {
            $type: Text,
            bind: `$option.${this.optionTextField}`,
         };

      this.itemConfig = this.children || this.items;

      delete this.items;
      delete this.children;

      super.init();
   }

   prepareData(context, instance) {
      let { data, store } = instance;

      data.stateMods = {
         multiple: this.multiple,
         disabled: data.disabled,
         readonly: data.readOnly,
      };

      data.selectedKeys = [];

      if (this.multiple) {
         if (isArray(data.values) && isArray(data.options)) {
            data.selectedKeys = data.values.map((v) => (this.keyBindings.length == 1 ? [v] : v));
            let map = {};
            data.options.filter(($option) => {
               let optionKey = getOptionKey(this.keyBindings, { $option });
               for (let i = 0; i < data.selectedKeys.length; i++)
                  if (areKeysEqual(optionKey, data.selectedKeys[i])) {
                     map[i] = convertOption(this.bindings, { $option });
                     break;
                  }
            });
            data.records = [];
            for (let i = 0; i < data.selectedKeys.length; i++) if (map[i]) data.records.push(map[i]);
         } else if (isArray(data.records))
            data.selectedKeys.push(
               ...data.records.map(($value) => this.keyBindings.map((b) => Binding.get(b.local).value({ $value })))
            );
      } else {
         let dataViewData = store.getData();
         data.selectedKeys.push(this.keyBindings.map((b) => Binding.get(b.local).value(dataViewData)));
         if (!this.text && isArray(data.options)) {
            let option = data.options.find(($option) =>
               areKeysEqual(getOptionKey(this.keyBindings, { $option }), data.selectedKeys[0])
            );
            data.text = (option && option[this.optionTextField]) || "";
         }
      }

      if (data.autoOpen) data.autoFocus = true;

      instance.lastDropdown = context.lastDropdown;

      super.prepareData(context, instance);
   }

   renderInput(context, instance, key) {
      return (
         <LookupComponent
            key={key}
            multiple={this.multiple}
            instance={instance}
            itemConfig={this.itemConfig}
            bindings={this.bindings}
            baseClass={this.baseClass}
            label={this.labelPlacement && getContent(this.renderLabel(context, instance, "label"))}
            help={this.helpPlacement && getContent(this.renderHelp(context, instance, "help"))}
         />
      );
   }

   filterOptions(instance, options, query) {
      if (!query) return options;
      let textPredicate = getSearchQueryPredicate(query);
      return options.filter((o) => isString(o[this.optionTextField]) && textPredicate(o[this.optionTextField]));
   }

   isEmpty(data) {
      if (this.multiple) return !isNonEmptyArray(data.values) && !isNonEmptyArray(data.records);
      return super.isEmpty(data);
   }

   formatValue(context, instance) {
      if (!this.multiple) return super.formatValue(context, instance);

      let { records, values, options } = instance.data;
      if (isArray(records))
         return records.map((record) => record[this.valueTextField] || record[this.valueIdField]).join(", ");

      if (isArray(values)) {
         if (isArray(options))
            return values
               .map((id) => {
                  let option = options.find((o) => o[this.optionIdField] == id);
                  return option ? option[this.valueTextField] : id;
               })
               .filter(Boolean)
               .join(", ");

         return values.join(", ");
      }

      return null;
   }
}

LookupField.prototype.baseClass = "lookupfield";
//LookupField.prototype.memoize = false;
LookupField.prototype.multiple = false;
LookupField.prototype.queryDelay = 150;
LookupField.prototype.minQueryLength = 0;
LookupField.prototype.hideSearchField = false;
LookupField.prototype.minOptionsForSearchField = 7;
LookupField.prototype.loadingText = "Loading...";
LookupField.prototype.queryErrorText = "Error occurred while querying for lookup data.";
LookupField.prototype.noResultsText = "No results found.";
LookupField.prototype.optionIdField = "id";
LookupField.prototype.optionTextField = "text";
LookupField.prototype.valueIdField = "id";
LookupField.prototype.valueTextField = "text";
LookupField.prototype.suppressErrorsUntilVisited = true;
LookupField.prototype.fetchAll = false;
LookupField.prototype.cacheAll = false;
LookupField.prototype.showClear = true;
LookupField.prototype.alwaysShowClear = false;
LookupField.prototype.closeOnSelect = true;
LookupField.prototype.minQueryLengthMessageText = "Type in at least {0} character(s).";
LookupField.prototype.icon = null;
LookupField.prototype.sort = false;
LookupField.prototype.listOptions = null;
LookupField.prototype.autoOpen = false;
LookupField.prototype.submitOnEnterKey = false;
LookupField.prototype.submitOnDropdownEnterKey = false;

Localization.registerPrototype("cx/widgets/LookupField", LookupField);

Widget.alias("lookupfield", LookupField);

function getOptionKey(bindings, data) {
   return bindings.filter((a) => a.key).map((b) => Binding.get(b.remote).value(data));
}

function areKeysEqual(key1, key2) {
   if (!key1 || !key2 || key1.length != key2.length) return false;

   for (let i = 0; i < key1.length; i++) if (key1[i] != key2[i]) return false;

   return true;
}

function convertOption(bindings, data) {
   let result = { $value: {} };
   bindings.forEach((b) => {
      let value = Binding.get(b.remote).value(data);
      result = Binding.get(b.local).set(result, value);
   });
   return result.$value;
}

class SelectionDelegate extends Selection {
   constructor({ delegate }) {
      super();
      this.delegate = delegate;
   }

   getIsSelectedDelegate(store) {
      return (record, index) => this.delegate(record, index);
   }

   select() {
      return false;
   }
}

class LookupComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      let { data, store } = this.props.instance;
      this.dom = {};
      this.state = {
         options: [],
         formatted: data.formatted,
         value: data.formatted,
         dropdownOpen: false,
         cursorKey: null,
         focus: false,
      };

      this.itemStore = new ReadOnlyDataView({
         store: store,
      });
   }

   getOptionKey(data) {
      return this.props.bindings.filter((a) => a.key).map((b) => Binding.get(b.remote).value(data));
   }

   getLocalKey(data) {
      return this.props.bindings.filter((a) => a.key).map((b) => Binding.get(b.local).value(data));
   }

   findOption(options, key) {
      if (!key) return -1;
      for (let i = 0; i < options.length; i++) {
         let optionKey = this.getOptionKey({ $option: options[i] });
         if (areKeysEqual(key, optionKey)) return i;
      }
      return -1;
   }

   getDropdown() {
      if (this.dropdown) return this.dropdown;

      let { widget, lastDropdown } = this.props.instance;

      this.list = Widget.create(
         <cx>
            <List
               sortField={widget.sort && widget.optionTextField}
               sortDirection="ASC"
               mod="dropdown"
               scrollSelectionIntoView
               {...widget.listOptions}
               records-bind="$options"
               recordName="$option"
               onItemClick={(e, inst) => this.onItemClick(e, inst)}
               pipeKeyDown={(kd) => {
                  this.listKeyDown = kd;
               }}
               selection={{
                  type: SelectionDelegate,
                  delegate: (data) =>
                     this.props.instance.data.selectedKeys.find((x) =>
                        areKeysEqual(x, this.getOptionKey({ $option: data }))
                     ) != null,
               }}
            >
               {this.props.itemConfig}
            </List>
         </cx>
      );

      let dropdown = {
         constrain: true,
         scrollTracking: true,
         inline: !isTouchDevice() || !!lastDropdown,
         placementOrder: "down-right down-left up-right up-left",
         ...widget.dropdownOptions,
         type: Dropdown,
         relatedElement: this.dom.input,
         renderChildren: () => this.renderDropdownContents(),
         onFocusOut: (e) => this.closeDropdown(e),
         memoize: false,
         touchFriendly: isTouchDevice(),
         onMeasureDropdownNaturalSize: () => {
            if (this.dom.dropdown && this.dom.list) {
               return {
                  height: this.dom.dropdown.offsetHeight + this.dom.list.scrollHeight - this.dom.list.offsetHeight,
               };
            }
         },
      };

      return (this.dropdown = Widget.create(dropdown));
   }

   renderDropdownContents() {
      let content;
      let { instance } = this.props;
      let { data, widget } = instance;
      let { CSS, baseClass } = widget;

      let searchVisible =
         !widget.hideSearchField &&
         (!isArray(data.options) ||
            (widget.minOptionsForSearchField && data.options.length >= widget.minOptionsForSearchField));

      if (this.state.status == "loading") {
         content = (
            <div key="msg" className={CSS.element(baseClass, "message", "loading")}>
               {widget.loadingText}
            </div>
         );
      } else if (this.state.status == "error") {
         content = (
            <div key="msg" className={CSS.element(baseClass, "message", "error")}>
               {widget.queryErrorText}
            </div>
         );
      } else if (this.state.status == "info") {
         content = (
            <div key="msg" className={CSS.element(baseClass, "message", "info")}>
               {this.state.message}
            </div>
         );
      } else if (this.state.options.length == 0) {
         content = (
            <div key="msg" className={CSS.element(baseClass, "message", "no-results")}>
               {widget.noResultsText}
            </div>
         );
      } else {
         content = (
            <div
               key="msg"
               ref={(el) => {
                  this.dom.list = el;
                  this.subscribeListOnWheel(el);
               }}
               className={CSS.element(baseClass, "scroll-container")}
            >
               <Cx widget={this.list} store={this.itemStore} options={{ name: "lookupfield-list" }} />
            </div>
         );
      }

      return (
         <div
            key="dropdown"
            ref={(el) => {
               this.dom.dropdown = el;
            }}
            className={CSS.element(baseClass, "dropdown")}
            tabIndex={0}
            onFocus={(e) => this.onDropdownFocus(e)}
            onKeyDown={(e) => this.onDropdownKeyPress(e)}
         >
            {searchVisible && (
               <input
                  key="query"
                  ref={(el) => {
                     this.dom.query = el;
                  }}
                  type="text"
                  className={CSS.element(baseClass, "query")}
                  onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                  }}
                  onChange={(e) => this.query(e.target.value)}
                  onBlur={(e) => this.onQueryBlur(e)}
               />
            )}
            {content}
         </div>
      );
   }

   onListWheel(e) {
      let { list } = this.dom;
      if (
         (list.scrollTop + list.offsetHeight == list.scrollHeight && e.deltaY > 0) ||
         (list.scrollTop == 0 && e.deltaY < 0)
      ) {
         e.preventDefault();
         e.stopPropagation();
      }
   }

   onDropdownFocus(e) {
      if (this.dom.query && !isFocused(this.dom.query) && !isTouchDevice()) FocusManager.focus(this.dom.query);
   }

   getPlaceholder(text) {
      let { CSS, baseClass } = this.props.instance.widget;

      if (text) return <span className={CSS.element(baseClass, "placeholder")}>{text}</span>;

      return <span className={CSS.element(baseClass, "placeholder")}>&nbsp;</span>;
   }

   render() {
      let { instance, label, help } = this.props;
      let { data, widget, state } = instance;
      let { CSS, baseClass, suppressErrorsUntilVisited } = widget;

      let icon = data.icon && (
         <div
            key="icon"
            className={CSS.element(baseClass, "left-icon")}
            onMouseDown={preventDefault}
            onClick={(e) => {
               this.openDropdown(e);
               e.stopPropagation();
               e.preventDefault();
            }}
         >
            {Icon.render(data.icon, {
               className: CSS.element(baseClass, "icon"),
            })}
         </div>
      );

      let dropdown;
      if (this.state.dropdownOpen) {
         this.itemStore.setData({
            $options: this.state.options,
         });
         dropdown = (
            <Cx widget={this.getDropdown()} store={this.itemStore} options={{ name: "lookupfield-dropdown" }} />
         );
      }

      let insideButton = null;

      if (!data.readOnly) {
         if (
            widget.showClear &&
            !data.disabled &&
            !this.props.multiple &&
            (widget.alwaysShowClear || !data.required) &&
            !data.empty
         ) {
            insideButton = (
               <div
                  key="ib"
                  onMouseDown={preventDefault}
                  onClick={(e) => this.onClearClick(e)}
                  className={CSS.element(baseClass, "clear")}
               >
                  <ClearIcon className={CSS.element(baseClass, "icon")} />
               </div>
            );
         } else {
            insideButton = (
               <div
                  key="ib"
                  className={CSS.element(baseClass, "tool")}
                  onMouseDown={preventDefault}
                  onClick={(e) => {
                     this.openDropdown(e);
                     e.stopPropagation();
                     e.preventDefault();
                  }}
               >
                  <DropdownIcon className={CSS.element(baseClass, "icon")} />
               </div>
            );
         }
      }

      let text;

      if (this.props.multiple) {
         let readOnly = data.disabled || data.readOnly;
         if (isArray(data.records) && data.records.length > 0) {
            text = data.records.map((v, i) => (
               <div
                  key={i}
                  className={CSS.element(baseClass, "tag", {
                     readonly: readOnly,
                  })}
               >
                  <span className={CSS.element(baseClass, "tag-value")}>{v[widget.valueTextField]}</span>
                  {!readOnly && (
                     <div
                        className={CSS.element(baseClass, "tag-clear")}
                        onMouseDown={(e) => {
                           e.preventDefault();
                           e.stopPropagation();
                        }}
                        onClick={(e) => this.onClearClick(e, v)}
                     >
                        <ClearIcon className={CSS.element(baseClass, "icon")} />
                     </div>
                  )}
               </div>
            ));
         } else {
            text = this.getPlaceholder(data.placeholder);
         }
      } else {
         text = !data.empty ? data.text || this.getPlaceholder() : this.getPlaceholder(data.placeholder);
      }

      let states = {
         visited: state.visited,
         focus: this.state.focus || this.state.dropdownOpen,
         icon: !!data.icon,
         empty: !data.placeholder && data.empty,
         error: data.error && (state.visited || !suppressErrorsUntilVisited || !data.empty),
      };

      return (
         <div
            className={CSS.expand(data.classNames, CSS.state(states))}
            style={data.style}
            onMouseDown={stopPropagation}
            onTouchStart={stopPropagation}
            onKeyDown={(e) => this.onKeyDown(e)}
         >
            <div
               id={data.id}
               className={CSS.expand(CSS.element(widget.baseClass, "input"), data.inputClass)}
               style={data.inputStyle}
               tabIndex={data.disabled ? null : data.tabIndex || 0}
               ref={(el) => {
                  this.dom.input = el;
               }}
               onMouseMove={(e) => tooltipMouseMove(e, ...getFieldTooltip(this.props.instance))}
               onMouseLeave={(e) => tooltipMouseLeave(e, ...getFieldTooltip(this.props.instance))}
               onClick={(e) => this.onClick(e)}
               onInput={(e) => this.onChange(e, "input")}
               onChange={(e) => this.onChange(e, "change")}
               onKeyDown={(e) => this.onInputKeyDown(e)}
               onMouseDown={(e) => this.onMouseDown(e)}
               onBlur={(e) => this.onBlur(e)}
               onFocus={(e) => this.onFocus(e)}
            >
               {text}
            </div>
            {insideButton}
            {icon}
            {dropdown}
            {label}
            {help}
         </div>
      );
   }

   onClick(e) {
      e.stopPropagation();
      e.preventDefault();
      this.openDropdown(e);
   }

   onItemClick(e, { store }) {
      this.select(e, store.getData());
      if (!this.props.instance.widget.submitOnEnterKey || e.type != "keydown") e.stopPropagation();
      e.preventDefault();
   }

   onClearClick(e, value) {
      let { instance } = this.props;
      let { data, store, widget } = instance;
      let { keyBindings } = widget;
      e.stopPropagation();
      e.preventDefault();
      if (widget.multiple) {
         if (isArray(data.records)) {
            let itemKey = this.getLocalKey({ $value: value });
            let newRecords = data.records.filter((v) => !areKeysEqual(this.getLocalKey({ $value: v }), itemKey));

            instance.set("records", newRecords);

            let newValues = newRecords
               .map((rec) => this.getLocalKey({ $value: rec }))
               .map((k) => (keyBindings.length == 1 ? k[0] : k));

            instance.set("values", newValues);
         }
      } else {
         this.props.bindings.forEach((b) => {
            store.set(b.local, widget.emptyValue);
         });
      }

      if (!isTouchEvent(e)) this.dom.input.focus();
   }

   select(e, itemData) {
      let { instance } = this.props;
      let { store, data, widget } = instance;
      let { bindings, keyBindings } = widget;

      if (widget.multiple) {
         let { selectedKeys, records } = data;

         let optionKey = this.getOptionKey(itemData);
         let newRecords = records;
         if (!selectedKeys.find((k) => areKeysEqual(optionKey, k))) {
            let valueData = {
               $value: {},
            };
            bindings.forEach((b) => {
               valueData = Binding.get(b.local).set(valueData, Binding.get(b.remote).value(itemData));
            });
            newRecords = [...(records || []), valueData.$value];
         } else {
            newRecords = records.filter((v) => !areKeysEqual(optionKey, this.getLocalKey({ $value: v })));
         }

         instance.set("records", newRecords);

         let newValues = newRecords
            .map((rec) => this.getLocalKey({ $value: rec }))
            .map((k) => (keyBindings.length == 1 ? k[0] : k));

         instance.set("values", newValues);
      } else {
         bindings.forEach((b) => {
            let v = Binding.get(b.remote).value(itemData);
            if (b.set) b.set(v, instance);
            else store.set(b.local, v);
         });
      }

      if (widget.closeOnSelect) {
         this.closeDropdown(e);
         if (!isTouchEvent(e)) this.dom.input.focus();
      }

      if (e.keyCode == KeyCode.enter && widget.submitOnDropdownEnterKey) {
         this.submitOnEnter(e);
      }
   }

   onDropdownKeyPress(e) {
      if (e.keyCode == KeyCode.enter) {
         let index = this.findOption(this.state.options, this.state.cursorKey);
         if (index != -1) {
            let itemData = {
               $option: this.state.options[index],
            };
            this.select(e, itemData);
         }
      }

      if (e.keyCode == KeyCode.esc) {
         this.closeDropdown(e);
         this.dom.input.focus();
      }

      if (this.listKeyDown) this.listKeyDown(e);
   }

   onKeyDown(e) {
      switch (e.keyCode) {
         case KeyCode.pageDown:
         case KeyCode.pageUp:
            if (this.state.dropdownOpen) e.preventDefault();
            break;
      }
   }

   onInputKeyDown(e) {
      let { instance } = this.props;
      if (instance.widget.handleKeyDown(e, instance) === false) return;

      switch (e.keyCode) {
         case KeyCode.delete:
            this.onClearClick(e);
            return;

         case KeyCode.shift:
         case KeyCode.ctrl:
         case KeyCode.tab:
         case KeyCode.left:
         case KeyCode.right:
         case KeyCode.pageUp:
         case KeyCode.pageDown:
         case KeyCode.insert:
         case KeyCode.esc:
            break;

         case KeyCode.down:
            this.openDropdown(e);
            e.stopPropagation();
            break;

         case KeyCode.enter:
            if (this.props.instance.widget.submitOnEnterKey) {
               this.submitOnEnter(e);
            } else {
               this.openDropdown(e);
            }
            break;

         default:
            this.openDropdown(e);
            break;
      }
   }

   onMouseDown(e) {
      e.preventDefault();
      e.stopPropagation();
      this.openDropdown(e);
   }

   onQueryBlur(e) {
      FocusManager.nudge();
   }

   onFocus(e) {
      let { instance } = this.props;
      let { widget } = instance;
      if (widget.trackFocus) {
         this.setState({
            focus: true,
         });
      }
   }

   onBlur(e) {
      if (!this.state.dropdownOpen) this.props.instance.setState({ visited: true });

      if (this.state.focus)
         this.setState({
            focus: false,
         });
   }

   closeDropdown(e) {
      if (this.state.dropdownOpen) {
         this.setState({
            dropdownOpen: false,
            cursorKey: null,
         });

         this.props.instance.setState({
            visited: true,
         });
      }

      //delete results valid only while dropdown is open
      delete this.tmpCachedResult;
   }

   openDropdown(e) {
      let { data } = this.props.instance;
      if (!this.state.dropdownOpen && !data.disabled && !data.readOnly) {
         this.query("");
         this.setState(
            {
               dropdownOpen: true,
            },
            () => {
               if (this.dom.dropdown) this.dom.dropdown.focus();
            }
         );
      }
   }

   query(q) {
      /*
       In fetchAll mode onQuery should fetch all data and after
       that everything is done filtering is done client-side.
       If cacheAll is set results are cached for the lifetime of the
       widget, otherwise cache is invalidated when dropdown closes.
       */

      let { instance } = this.props;
      let { widget, data } = instance;

      this.lastQuery = q;

      //do not make duplicate queries if fetchAll is enabled
      if (widget.fetchAll && this.state.status == "loading") return;

      if (this.queryTimeoutId) clearTimeout(this.queryTimeoutId);

      if (q.length < widget.minQueryLength) {
         this.setState({
            status: "info",
            message: StringTemplate.format(widget.minQueryLengthMessageText, widget.minQueryLength),
         });
         return;
      }

      if (isArray(data.options)) {
         let results = widget.filterOptions(this.props.instance, data.options, q);
         this.setState({
            options: results,
            status: "loaded",
         });
      }

      if (widget.onQuery) {
         let { queryDelay, fetchAll, cacheAll } = widget;

         if (fetchAll) queryDelay = 0;

         if (!this.cachedResult) {
            this.setState({
               status: "loading",
            });
         }

         this.queryTimeoutId = setTimeout(() => {
            delete this.queryTimeoutId;

            let result = this.tmpCachedResult || this.cachedResult;
            if (!result) result = instance.invoke("onQuery", fetchAll ? "" : q, instance);

            let query = (this.lastQueryId = Date.now());

            Promise.resolve(result)
               .then((results) => {
                  //discard results which do not belong to the last query
                  if (query !== this.lastQueryId) return;

                  if (!isArray(results)) results = [];

                  if (fetchAll) {
                     if (cacheAll) this.cachedResult = results;
                     else this.tmpCachedResult = results;

                     results = widget.filterOptions(this.props.instance, results, this.lastQuery);
                  }

                  this.setState({
                     options: results,
                     status: "loaded",
                  });
               })
               .catch((err) => {
                  this.setState({ status: "error" });
                  debug("Lookup query error:", err);
               });
         }, queryDelay);
      }
   }

   UNSAFE_componentWillReceiveProps(props) {
      tooltipParentWillReceiveProps(this.dom.input, ...getFieldTooltip(props.instance));
   }

   componentDidMount() {
      tooltipParentDidMount(this.dom.input, ...getFieldTooltip(this.props.instance));
      autoFocus(this.dom.input, this);
      if (this.props.instance.data.autoOpen) this.openDropdown(null);
   }

   componentDidUpdate() {
      autoFocus(this.dom.input, this);
   }

   componentWillUnmount() {
      if (this.queryTimeoutId) clearTimeout(this.queryTimeoutId);
      tooltipParentWillUnmount(this.props.instance);
      this.subscribeListOnWheel(null);
   }

   subscribeListOnWheel(list) {
      if (this.unsubscribeListOnWheel) {
         this.unsubscribeListOnWheel();
         this.unsubscribeListOnWheel = null;
      }
      if (list) {
         this.unsubscribeListOnWheel = addEventListenerWithOptions(list, "wheel", (e) => this.onListWheel(e), {
            passive: false,
         });
      }
   }

   submitOnEnter(e) {
      let instance = this.props.instance.parent;
      while (instance) {
         if (instance.events && instance.events.onSubmit) {
            instance.events.onSubmit(e, instance);
            break;
         } else {
            instance = instance.parent;
         }
      }
   }
}
