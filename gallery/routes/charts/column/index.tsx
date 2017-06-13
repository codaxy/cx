import {cx, Button, Section, FlexRow, Route, RedirectRoute, PureContainer} from 'cx/widgets';
import {bind, expr, FirstVisibleChildLayout} from 'cx/ui';

import {getHeader} from "../../../components/getHeader";
import {asyncRoute} from "../../../components/asyncRoute";

const header = getHeader({
    title: "Column",
    tabs: {
        customized: 'Custom columns',
        normalized: 'Normalized',
        stacked: 'Stacked',
        "auto-column-width": 'Auto-calculated Column Widths',
        combination: 'Combination'
    },
    docsUrl: 'https://cxjs.io/docs/charts/columns'
});

import Default from './customized';

export default <cx>
    {header}
    <PureContainer layout={FirstVisibleChildLayout}>
        <Route url={{bind: '$root.url'}} route="+/customized">
            {Default}
        </Route>
        { asyncRoute("+/normalized", () => System.import("./normalized")) }
        { asyncRoute("+/stacked", () => System.import("./stacked")) }
        { asyncRoute("+/auto-column-width", () => System.import("./auto-column-width")) }
        { asyncRoute("+/combination", () => System.import("./combination")) }
        <RedirectRoute redirect="+/customized" />
    </PureContainer>
</cx>

import {hmr} from '../../hmr.js';
hmr(module);