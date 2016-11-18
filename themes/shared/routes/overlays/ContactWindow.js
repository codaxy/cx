import {HtmlElement} from 'cx/ui/HtmlElement';
import {Window} from 'cx/ui/overlay/Window';
import {TextField} from 'cx/ui/form/TextField';
import {TextArea} from 'cx/ui/form/TextArea';
import {Checkbox} from 'cx/ui/form/Checkbox';
import {LabelsLeftLayout} from 'cx/ui/layout/LabelsLeftLayout';
import {Section} from 'shared/components/Section';
import {FlexRow} from 'shared/components/FlexBox';
import {Button} from 'cx/ui/Button';

export default <cx>
   <Window
      visible={{
         bind: "$page.contact.visible",
         defaultValue: false
      }}
      style="width:600px"
      title="Contact"
      resizable
      backdrop
      center
      footer={
         <FlexRow>
            <div style="margin-left: auto" preserveWhitespace>
               <Button mod="primary">Send</Button>
               <Button dismiss>Cancel</Button>
            </div>
         </FlexRow>
      }
   >
      <Section layout={{ type: LabelsLeftLayout, mod: 'stretch' }}>
         <TextField label="Email" value:bind="$page.contact.email" required/>
         <TextField label="Name" value:bind="$page.contact.name" required/>
         <TextArea label="Message" value:bind="$page.contact.msg" required style="width:100%" rows={10}/>
      </Section>
   </Window>
</cx>
