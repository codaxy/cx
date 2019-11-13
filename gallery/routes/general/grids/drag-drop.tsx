﻿import {DragHandle, FlexRow, Grid, HtmlElement, Section, cx} from "cx/widgets";
import {Controller, KeySelection, bind} from "cx/ui";

//Filtering not implemented to keep it short
function insertElement(array, index, ...args) {
    return [...array.slice(0, index), ...args, ...array.slice(index)];
}

function move(store, target, e) {
    let selection = e.source.records.map(r => r.data);

    store.update(
        e.source.data.source,
        array => array.filter((a, i) => selection.indexOf(a) == -1)
    );

    if (e.source.data.source == target) e.source.records.forEach(record => {
        if (record.index < e.target.insertionIndex) e.target.insertionIndex--;
    });

    store.update(target, insertElement, e.target.insertionIndex, ...selection);
}

class PageController extends Controller {
    init() {
        this.store.init(
            "grid1",
            Array.from({length: 10}, (_, c) => ({
                id: c + 1,
                name: "Item " + (c + 1),
                number: Math.random() * 100
            }))
        );

        this.store.init(
            "grid2",
            Array.from({length: 10}, (_, c) => ({
                id: 10000 + c + 1,
                name: "Item " + (c + 1),
                number: Math.random() * 100
            }))
        );
    }
}
;

export default (
    <cx>
        <a href="https://github.com/codaxy/cx/tree/master/gallery/routes/general/grids/drag-drop.tsx" target="_blank"
            putInto="github">Source Code</a>

        <FlexRow target="tablet" wrap controller={PageController} spacing="large">
            <Section mod="well" title="Full Row" hLevel={4}>
                <Grid
                    records={bind("grid1")}
                    scrollable
                    style="height: 400px"
                    columns={
                        [
                            {
                                field: "name",
                                header: "Name",
                                sortable: true,
                                style: "width: 300px"
                            },
                            {
                                field: "number",
                                header: "Number",
                                format: "n;2",
                                sortable: true,
                                align: "right"
                            }
                        ]
                    }
                    dragSource={{data: {type: "record", source: "grid1"}}}
                    onDropTest={e => e.source.data.type == "record"}
                    onDrop={(e, {store}) => move(store, "grid1", e)}
                    selection={{type: KeySelection, multiple: true, bind: "s1"}}
                />
            </Section>
            <Section mod="well" title="Row Handle" hLevel={4}>
                <Grid
                    records={bind("grid2")}
                    scrollable
                    style="height: 400px"
                    columns={[
                        {
                            items: (
                                <cx>
                                    <DragHandle style="cursor:move">
                                        ☰
                                    </DragHandle>
                                </cx>
                            )
                        },
                        {
                            style: "width: 300px",
                            field: "name",
                            header: "Name",
                            sortable: true
                        },
                        {
                            field: "number",
                            header: "Number",
                            format: "n;2",
                            sortable: true,
                            align: "right"
                        }
                    ]}
                    dragSource={
                        {mode: "copy", data: {type: "record", source: "grid2"}}
                    }
                    dropZone={{mode: "insertion"}}
                    onDropTest={e => e.source.data.type == "record"}
                    onDrop={(e, {store}) => move(store, "grid2", e)}
                />
            </Section>
        </FlexRow>
    </cx>
);

import {hmr} from '../../hmr.js';
hmr(module);