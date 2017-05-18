
import {cx, Section, FlexRow, MonthPicker} from 'cx/widgets';
import {bind} from 'cx/ui';

export default <cx>
    <FlexRow>
        <Section mod="well">
            <FlexRow spacing="large" wrap justify="center" >
                <div>
                    <h6>Single selection</h6>
                    <MonthPicker value={bind("$page.date")} style="height:30em" />
                </div>
                <div>
                    <h6>Range</h6>
                    <MonthPicker range from={bind("$page.from")} to={bind("$page.to")} style="height:30em" />
                </div>
                <div>
                    <h6>Disabled</h6>
                    <MonthPicker range from={bind("$page.from")} to={bind("$page.to")} style="height:30em" disabled />
                </div>
            </FlexRow>
        </Section>
    </FlexRow>
</cx>

import {hmr} from '../hmr.js';
declare let module: any;
hmr(module);