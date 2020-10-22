import { Widget } from "../../ui/Widget";
import { HtmlElement } from "../HtmlElement";
import { Window } from "./Window";
import { Button } from "../Button";
import { Localization } from "../../ui/Localization";
import { FlexRow } from "../FlexBox";
import { registerAlertImpl } from "./alerts";
import { isString } from "../../util/isString";

export class MsgBox {
   static alert(options) {
      if (isString(options))
         options = {
            message: options,
         };

      return new Promise(function (resolve) {
         let callback = (e, instance) => {
            if (options.callback && options.callback() === false) return;
            instance.parentOptions.dismiss();
            resolve();
         };

         let w = Widget.create(
            <cx>
               <Window
                  title={options.title}
                  header={options.header}
                  mod="alert"
                  modal
                  center
                  resizable={false}
                  closable={false}
                  style={options.style || "max-width: 90vw"}
                  dismissOnPopState
               >
                  {options.message || options.items || options.children}
                  <FlexRow
                     putInto="footer"
                     direction={MsgBox.prototype.footerDirection}
                     justify={MsgBox.prototype.footerJustify}
                  >
                     <Button mod={MsgBox.prototype.buttonMod} onClick={callback}>
                        {options.okText || "OK"}
                     </Button>
                  </FlexRow>
               </Window>
            </cx>
         );

         w.open(options.store);
      });
   }

   static yesNo(options) {
      if (isString(options))
         options = {
            message: options,
         };

      return new Promise(function (resolve, reject) {
         let callback = (option) => (e, instance) => {
            if (options.callback && options.callback(option) === false) return;
            instance.parentOptions.dismiss();
            if (option == "yes") resolve(option);
            else resolve(option);
         };
         let w = Widget.create(
            <cx>
               <Window
                  title={options.title}
                  header={options.header}
                  mod="alert"
                  modal
                  center
                  resizable={false}
                  closable={false}
                  style={options.style || "max-width: 90vw"}
                  dismissOnPopState
               >
                  {options.message || options.items || options.children}
                  <FlexRow
                     putInto="footer"
                     direction={MsgBox.prototype.footerDirection}
                     justify={MsgBox.prototype.footerJustify}
                     hspacing="small"
                  >
                     <Button mod={options.yesButtonMod || MsgBox.prototype.buttonMod} onClick={callback("yes")}>
                        {options.yesText || MsgBox.prototype.yesText}
                     </Button>
                     <Button mod={options.noButtonMod || MsgBox.prototype.buttonMod} onClick={callback("no")}>
                        {options.noText || MsgBox.prototype.noText}
                     </Button>
                  </FlexRow>
               </Window>
            </cx>
         );

         w.open(options.store);
      });
   }
}

MsgBox.prototype.buttonMod = null;
MsgBox.prototype.footerDirection = "row";
MsgBox.prototype.footerJustify = "center";
MsgBox.prototype.yesText = "Yes";
MsgBox.prototype.noText = "No";
Localization.registerPrototype("cx/widgets/MsgBox", MsgBox);

export function enableMsgBoxAlerts() {
   registerAlertImpl({
      yesNo: MsgBox.yesNo.bind(MsgBox),
      alert: MsgBox.alert.bind(MsgBox),
   });
}
