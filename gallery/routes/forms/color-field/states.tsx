
import {cx, Section, FlexRow, ColorField, HelpText} from 'cx/widgets';
import {bind, LabelsLeftLayout, LabelsTopLayout} from 'cx/ui';

export default <cx>
    <FlexRow wrap spacing="large" target="desktop">
        <Section mod="card" title="Material Labels" hLevel={4} visible={{expr: "{$root.$route.theme} == 'material'"}} >
            <ColorField value={bind("standard")} label="Standard" labelPlacement="material" />
            <br/>
            <ColorField value={bind("standard")} label="Disabled" labelPlacement="material" disabled />
            <br/>
            <ColorField value={bind("standard")} label="Read only" labelPlacement="material" readOnly />
            <br/>
            <ColorField value={bind("standard")} label="View mode" labelPlacement="material" mode="view" emptyText="N/A"/>
            <br/>
            <ColorField value={bind("placeholder")} label="Placeholder" labelPlacement="material" placeholder="Select a color..." />
        </Section>
        <Section mod="card" title="Horizontal Labels" hLevel={4} layout={LabelsLeftLayout} >
            <ColorField value={bind("standard")} label="Standard" />
            <ColorField value={bind("standard")} label="Disabled" disabled />
            <ColorField value={bind("standard")} label="Read only" readOnly />
            <ColorField value={bind("standard")} label="View mode" mode="view" emptyText="N/A" />
            <ColorField value={bind("placeholder")} label="Placeholder" placeholder="Select a color..." />
        </Section>
        <Section mod="card" title="Labels on Top" hLevel={4} layout={{type: LabelsTopLayout, vertical: true}} >
            <ColorField value={bind("standard")} label="Standard" />
            <ColorField value={bind("standard")} label="Disabled" disabled />
            <ColorField value={bind("standard")} label="Read only" readOnly />
            <ColorField value={bind("standard")} label="View mode" mode="view" emptyText="N/A" />
            <ColorField value={bind("placeholder")} label="Placeholder" placeholder="Select a color..." />
        </Section>
        <Section mod="card" title="Helpers" hLevel={4} layout={LabelsLeftLayout} >
            <ColorField value={bind("placeholder")} label="Placeholder" placeholder="Select a color..." />
            <ColorField value={{ bind: "clear", defaultValue: "rgba(34,194,236,1)"}} label="Clear" />
            <ColorField value={bind("tooltip")} label="Tooltip" tooltip="This is a tooltip." />
            <ColorField value={bind("inline")} label="Help" help="Inline" />
            <ColorField 
                value={bind("block")} 
                label="Help" 
                help={<cx><HelpText mod="block">Block</HelpText></cx>} 
            />
        </Section>
        <Section mod="card" title="Validation" hLevel={4} layout={LabelsLeftLayout} >
            <ColorField value={bind("required")} label="Required" required />
            <ColorField value={bind("visited")} label="Visited" required visited />
            <ColorField value={bind("asterisk")} label="Asterisk" required asterisk />
        </Section>
        <Section mod="card" title="Validation Modes" hLevel={4} layout={LabelsLeftLayout} >
            <ColorField value={bind("validation.tooltip")} label="Tooltip" required />
            <ColorField value={bind("validation.help")} label="Help" required validationMode="help" />
            <ColorField value={bind("validation.block")} label="Help Block" required validationMode="help-block" />
            <ColorField value={bind("validation.block")} 
                label="Material" 
                required 
                validationMode="help"
                helpPlacement="material"
                visible={{expr: "{$root.$route.theme} == 'material'"}}
            />
        </Section>
    </FlexRow>
</cx>

import {hmr} from '../../hmr.js';
declare let module: any;
hmr(module);