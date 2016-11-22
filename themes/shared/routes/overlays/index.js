import {Button} from 'cx/ui/Button';
import {HtmlElement} from 'cx/ui/HtmlElement';
import {Section} from 'shared/components/Section';
import {FlexRow} from 'shared/components/FlexBox';
import {MsgBox} from 'cx/ui/overlay/MsgBox';

import LoginWindow from './LoginWindow';
import ContactWindow from './ContactWindow';

import Menu1 from './Menu1';
import Toasts from './Toasts';

export default <cx>
   <span putInto="breadcrumbs">Overlays</span>

   <FlexRow distance wrap>
      <Section mod="well" title="Windows" style="flex:1">
         <FlexRow distance align>
            <Button onClick={(e, {store}) => { store.toggle('$page.login.visible')}}>Modal</Button>
            <Button onClick={(e, {store}) => { store.toggle('$page.contact.visible')}}>Backdrop</Button>
            <Button onClick={()=>{MsgBox.alert('This is a very important message.')}}>Alert</Button>
            <Button onClick={()=>{MsgBox.yesNo('Would you like to close this window?')}}>Confirm</Button>
         </FlexRow>
         <LoginWindow />
         <ContactWindow />
      </Section>

      <Section mod="well" title="Menus" style="flex:1">
         <Menu1 />
      </Section>

      <Section mod="well" title="Toasts" style="flex:1">
         <Toasts />
      </Section>
   </FlexRow>
</cx>
