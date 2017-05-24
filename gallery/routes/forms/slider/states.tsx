
import {cx, Section, FlexRow, ColorField, Slider, HelpText} from 'cx/widgets';
import {bind, LabelsLeftLayout, LabelsTopLayout} from 'cx/ui';

export default <cx>
    <FlexRow wrap spacing="large" target="desktop">
        <Section mod="card" title="Material Labels" hLevel={4} visible={{expr: "{$root.$route.theme} == 'material'"}} >
            <Slider label="Standard" value={bind("standard")} labelPlacement="material" />
            <br/>
            <Slider label="Disabled" value={bind("standard")} labelPlacement="material" disabled />
            <br/>
            <Slider label="Read only" value={bind("standard")} labelPlacement="material" readOnly />
        </Section>
        <Section mod="card" title="Horizontal Labels" hLevel={4} layout={LabelsLeftLayout} >
            <Slider label="Standard" value={bind("standard")} />
            <Slider label="Disabled" value={bind("standard")} disabled />
            <Slider label="Read only" value={bind("standard")} readOnly />
        </Section>
        <Section mod="card" title="Labels on Top" hLevel={4} layout={{type: LabelsTopLayout, vertical: true}} >
            <Slider label="Standard" value={bind("standard")} />
            <Slider label="Disabled" value={bind("standard")} disabled />
            <Slider label="Read only" value={bind("standard")} readOnly />
        </Section>
        <Section mod="card" title="Helpers" hLevel={4} layout={LabelsLeftLayout} >
            <Slider label="Tooltip" value={bind("tooltip")} tooltip={{
                text:{tpl: '{tooltip:n;2}' },
                placement: 'up'
            }} />
            <Slider label="Help" value={bind("inline")} help="Inline" />
            <Slider label="Help" value={bind("block")} help={<cx><HelpText mod="block">Block</HelpText></cx>} />
        </Section>
        <Section mod="card" title="Misc" hLevel={4} layout={LabelsLeftLayout} >
            <Slider label="Range" from={bind("from")} to={bind("to")} />
            <Slider label="Stepped" value={bind("stepped")} step={10} />
            <Slider label="Styled" value={bind("styled")} rangeStyle="background:lightgreen" />
            <Slider label="Vertical" value={bind("vertical")} vertical />
        </Section>
    </FlexRow>
</cx>

import {hmr} from '../../hmr.js';
declare let module: any;
hmr(module);