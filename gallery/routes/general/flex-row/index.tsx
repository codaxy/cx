import {cx, Button, Section, FlexRow, Route, RedirectRoute, PureContainer} from 'cx/widgets';
import {bind, expr, FirstVisibleChildLayout} from 'cx/ui';

import {getHeader} from "../../../components/getHeader";
import {SandboxedRoute, SandboxedAsyncRoute} from "../../../components/asyncRoute";

const header = getHeader({
    title: "FlexRow",
    tabs: {
        options: 'Options',
        "sidebar-layout": "Sidebar Layout"
    },
    docsUrl: 'https://cxjs.io/docs/widgets/FlexBox'
});

import Default from './options';

export default <cx>
    {header}
    <PureContainer layout={FirstVisibleChildLayout}>
        <SandboxedRoute route="+/options">
            {Default}
        </SandboxedRoute>
        <SandboxedAsyncRoute route="+/sidebar-layout" content={()=>System.import("./sidebar-layout")} />
        <RedirectRoute redirect="+/options" />
    </PureContainer>
</cx>

import {hmr} from '../../hmr.js';
hmr(module);