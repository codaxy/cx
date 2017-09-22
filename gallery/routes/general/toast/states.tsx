import {cx, Section, FlexRow, Toast, Button, TextField} from 'cx/widgets';
import {LabelsLeftLayout, bind, expr} from 'cx/ui';

function createToast(e, {store}, placement) {
    let toast = Toast.create({
        message: 'This is a toast.',
        placement: placement,
        timeout: 2000
    });
    toast.open(store);
}

export default <cx>
    <a href="https://github.com/codaxy/cx/tree/master/gallery/routes/general/toast/states.tsx" target="_blank" putInto="github">Source Code</a>
    <FlexRow wrap spacing="large" target="tablet" align="start">
        <Section mod="card">
            <FlexRow spacing wrap>
                <Button onClick={ (e, ins) => createToast(e, ins, 'top')}>Top Toast</Button>
                <Button onClick={ (e, ins) => createToast(e, ins, 'bottom')}>Bottom Toast</Button>

                <Button onClick={ (e, ins) => createToast(e, ins, 'left')}>Left Toast</Button>
                <Button onClick={ (e, ins) => createToast(e, ins, 'right')}>Right Toast</Button>

                <Button onClick={ (e, {store}) => store.toggle('$page.toast.visible')}>Toggle Toast</Button>
                <Button onClick={ (e, {store}) => store.toggle('$page.complex.visible')}>Closable Toast</Button>
                <Button onClick={ (e, {store}) => store.toggle('$page.info.message.visible')}>Info Message</Button>
                <Button onClick={ (e, {store}) => store.toggle('$page.success.message.visible')}>Success Message</Button>
                <Button onClick={ (e, {store}) => store.toggle('$page.warning.message.visible')}>Warning Message</Button>
                <Button onClick={ (e, {store}) => store.toggle('$page.error.message.visible')}>Error Message</Button>
                <Button 
                    visible={{expr: "{$root.$route.theme} == 'material'"}} 
                    onClick={ (e, {store}) => store.toggle('$page.dark.toast.visible')}>
                        Dark Toast
                </Button>
            </FlexRow>

            <Toast visible={bind("$page.toast.visible")} preserveWhitespace>
                This toast is visible only on this page.
            </Toast>

            <Toast visible={bind("$page.info.message.visible")} mod='info' preserveWhitespace>
                This toast has mod='info' set.
                <Button mod="hollow" icon="close" style="margin-left: 15px;" dismiss/>
            </Toast>

            <Toast visible={bind("$page.success.message.visible")} mod='success' preserveWhitespace>
                This toast has mod='success' set.
                <Button mod="hollow" icon="close" style="margin-left: 15px;" dismiss/>
            </Toast>

            <Toast visible={bind("$page.error.message.visible")} mod='error' preserveWhitespace>
                This toast has mod='error' set.
                <Button mod="hollow" icon="close" style="margin-left: 15px;" dismiss/>
            </Toast>

            <Toast visible={bind("$page.warning.message.visible")} mod='warning' preserveWhitespace>
                This toast has mod='warning' set.
                <Button mod="hollow" icon="close" style="margin-left: 15px;" dismiss/>
            </Toast>

            <Toast visible={bind("$page.dark.toast.visible")} mod='dark' preserveWhitespace>
                This toast has mod='dark' set.                
            </Toast>

            <Toast visible={bind("$page.complex.visible")} ws>
                <FlexRow spacing="xsmall">
                    <TextField value={bind("$page.name")} label="Quick Reply:"/>
                    <Button dismiss disabled={expr("{$page.name} == null")}>Send</Button>
                    <Button mod="hollow" icon="close" dismiss/>
                </FlexRow>
            </Toast>
        </Section>
    </FlexRow>
</cx>

import {hmr} from '../../hmr.js';
hmr(module);