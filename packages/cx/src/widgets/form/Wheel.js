import { VDOM } from "../../ui/Widget";
import { PureContainer } from "../../ui/PureContainer";
import { KeyCode } from "../../util/KeyCode";
import { Icon } from "../Icon";
import { addEventListenerWithOptions } from "../../util";

export class Wheel extends PureContainer {
   declareData() {
      return super.declareData(...arguments, {
         value: undefined,
         options: undefined,
      });
   }

   render(context, instance, key) {
      let { data } = instance;
      let { value, options } = data;
      let index = options.findIndex((a) => a.id === value);
      if (index === -1) index = Math.floor(options.length / 2);

      return (
         <WheelComponent
            key={key}
            size={this.size}
            focusable
            CSS={this.CSS}
            baseClass={this.baseClass}
            className={data.classNames}
            style={data.style}
            index={index}
            onChange={(newIndex) => {
               let option = options[newIndex];
               instance.set("value", option.id);
            }}
         >
            {options.map((o, i) => (
               <span key={0}>{o.text}</span>
            ))}
         </WheelComponent>
      );
   }
}

Wheel.prototype.baseClass = "wheel";
Wheel.prototype.size = 3;
Wheel.prototype.styled = true;

export class WheelComponent extends VDOM.Component {
   constructor(props) {
      super(props);
      this.state = {};
      this.index = props.index || 0;
      this.wheelRef = (el) => {
         this.wheelEl = el;
      };
      this.scrollRef = (el) => {
         this.scrollEl = el;
      };
      this.onWheel = this.onWheel.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
   }

   render() {
      let { size, children, CSS, baseClass, active, className, style, onMouseDown } = this.props;
      let optionClass = CSS.element(baseClass, "option");
      let dummyClass = CSS.element(baseClass, "option", { dummy: true });

      let tpad = [],
         bpad = [],
         padSize = 0;

      for (let i = 0; i < (size - 1) / 2; i++) {
         tpad.push({ key: -1 - i, child: children[0], cls: dummyClass });
         bpad.push({ key: -100 - i, child: children[0], cls: dummyClass });
         padSize++;
      }

      let displayedOptions = [
         ...tpad,
         ...children.map((c, i) => ({
            key: i,
            child: c,
            cls: optionClass,
         })),
         ...bpad,
      ];

      if (!this.state.wheelHeight) displayedOptions = displayedOptions.slice(this.index, this.index + size);

      return (
         <div
            tabIndex={this.props.focusable ? data.tabIndex || 0 : null}
            className={className || CSS.element(baseClass, "container", { active })}
            style={style}
            onKeyDown={this.onKeyDown}
         >
            <div
               className={CSS.element(baseClass, "clip")}
               style={{
                  width: this.state.wheelWidth,
               }}
               onMouseDown={onMouseDown}
            >
               <div
                  className={CSS.element(baseClass, "vscroll")}
                  ref={this.scrollRef}
                  onTouchStart={this.onTouchStart.bind(this)}
                  onTouchEnd={this.onTouchEnd.bind(this)}
               >
                  <div
                     className={CSS.element(baseClass, "wheel")}
                     style={{
                        height: this.state.wheelHeight,
                     }}
                     ref={this.wheelRef}
                  >
                     {displayedOptions.map((opt) => (
                        <div key={opt.key} className={opt.cls}>
                           {opt.child}
                        </div>
                     ))}
                  </div>
               </div>
               <div
                  className={CSS.element(baseClass, "mask")}
                  style={{
                     top: `0`,
                     bottom: `${(50 + 50 / size).toFixed(3)}%`,
                  }}
               />
               <div
                  className={CSS.element(baseClass, "mask")}
                  style={{
                     top: `${(50 + 50 / size).toFixed(3)}%`,
                     bottom: `0`,
                  }}
               />
               <div
                  className={CSS.element(baseClass, "selection")}
                  style={{
                     height: `${(100 / size).toFixed(3)}%`,
                     top: `${(50 - 50 / size).toFixed(3)}%`,
                  }}
               />
            </div>
            <div
               className={CSS.element(baseClass, "arrow-up")}
               onClick={(e) => {
                  e.preventDefault();
                  this.select(this.index - 1);
               }}
            >
               {Icon.render("drop-down", { className: CSS.element(baseClass, "arrow-icon") })}
            </div>
            <div
               className={CSS.element(baseClass, "arrow-down")}
               onClick={(e) => {
                  e.preventDefault();
                  this.select(this.index + 1);
               }}
            >
               {Icon.render("drop-down", { className: CSS.element(baseClass, "arrow-icon") })}
            </div>
         </div>
      );
   }

   componentDidMount() {
      this.unsubscribeOnWheel = addEventListenerWithOptions(this.wheelEl, "wheel", this.onWheel, { passive: false });

      this.setState(
         {
            wheelHeight: this.wheelEl.offsetHeight,
            wheelWidth: this.wheelEl.offsetWidth,
         },
         () => {
            this.scrollEl.scrollTop = (this.index * this.state.wheelHeight) / this.props.size;
         }
      );

      if (this.props.onPipeKeyDown) this.props.onPipeKeyDown(this.onKeyDown);
   }

   UNSAFE_componentWillReceiveProps(props) {
      this.index = props.index || 0;
      this.scrollTo();
   }

   componentWillUnmount() {
      this.scrolling = false;
      this.unsubscribeOnWheel();
   }

   onKeyDown(e) {
      switch (e.keyCode) {
         case KeyCode.up:
            e.preventDefault();
            this.select(this.index - 1);
            break;

         case KeyCode.down:
            e.preventDefault();
            this.select(this.index + 1);
            break;
      }
   }

   onWheel(e) {
      e.preventDefault();
      let index = this.index;
      if (e.deltaY > 0) index++;
      else index--;
      this.select(index);
   }

   onTouchStart(e) {
      this.scrolling = false;
   }

   onTouchEnd(e) {
      let { size } = this.props;
      let index = Math.round(this.scrollEl.scrollTop / (this.state.wheelHeight / size));
      this.select(index);
   }

   select(newIndex) {
      let { children } = this.props;
      newIndex = Math.max(0, Math.min(children.length - 1, newIndex));
      if (this.index !== newIndex) {
         this.index = newIndex;
         this.props.onChange(newIndex);
      }
      this.scrollTo();
   }

   scrollTo() {
      let { size } = this.props;

      let callback = () => {
         if (!this.scrolling) return;

         let x = (this.index * this.state.wheelHeight) / size;
         let delta = Math.round(x - this.scrollEl.scrollTop);
         if (delta === 0) {
            this.scrolling = false;
            return;
         }
         let sign = delta > 0 ? 1 : -1;
         delta = Math.abs(delta) / 10;
         if (delta < 1) delta = 1;

         this.scrollEl.scrollTop += sign * delta;
         requestAnimationFrame(callback);
      };

      if (!this.scrolling) {
         this.scrolling = true;
         requestAnimationFrame(callback);
      }
   }
}
