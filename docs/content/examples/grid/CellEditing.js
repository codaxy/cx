import {Grid, HtmlElement, Select, TextField, LookupField, NumberField} from "cx/widgets";
import {Content, Controller, KeySelection, bind} from "cx/ui";
import {casual} from '../data/casual';
import {CodeSplit} from "../../../components/CodeSplit";
import {Md} from "../../../components/Md";
import {CodeSnippet} from "../../../components/CodeSnippet";
import { KeyCode } from "cx/util";

class PageController extends Controller {
    onInit() {
        //init grid data
        if (!this.store.get('$page.records')) {
            this.store.set(
                "$page.records",
                Array
                    .from({length: 1000})
                    .map((v, i) => ({
                        id: i + 1,
                        fullName: casual.full_name,
                        continent: casual.continent,
                        browser: casual.browser,
                        os: casual.operating_system,
                        visits: casual.integer(1, 100)
                    }))
            );
        }
    }
}

export const CellEditing = (
    <cx>
        <Md controller={PageController}>
            <CodeSplit>
                # Cell Editing

                To setup cell editing set the `cellEditable` flag on the grid
                and specify `editor` widget configurations for all editable columns.
                If some of the cells should not be editable, disable editing using the `editable` property.
                Use the `onCellEdited` callback to react on changes, e.g. update the record in the database.
                For grids with many records it is recommended to [use buffering](./buffering) for optimal performance.

                <Grid
                    cellEditable
                    onCellEdited={(change, record) => {
                        console.log(change, record);
                    }}
                    records:bind="$page.records"
                    scrollable
                    buffered
                    style="height: 600px;"
                    lockColumnWidths
                    cached
                    columns={
                        [
                            {header: "#", field: "index", sortable: true, value: {bind: "$index"}},
                            {
                                header: "Name",
                                field: "fullName",
                                sortable: true,
                                editor: <cx>
                                    <TextField
                                        value-bind="$record.fullName"
                                        required
                                        visited
                                    />
                                </cx>
                            },
                            {
                                header: "Continent", field: "continent", sortable: true,
                                editor: <cx>
                                    <Select
                                        value-bind="$record.continent"
                                        required
                                    >
                                        <option value="Africa">Africa</option>
                                        <option value="Antarctica">Antarctica</option>
                                        <option value="Asia">Asia</option>
                                        <option value="Australia">Australia</option>
                                        <option value="Europe">Europe</option>
                                        <option value="North America">North America</option>
                                        <option value="South America">South America</option>
                                    </Select>
                                </cx>
                            },
                            {
                                header: "Browser", field: "browser", sortable: true,
                                editor: <cx>
                                    <LookupField
                                        value-bind="$record.browser"
                                        required
                                        autoOpen
                                        submitOnEnterKey
                                        options={[
                                            { id: "Opera", text: "Opera" },
                                            { id: "Safari", text: "Safari" },
                                            { id: "Chrome", text: "Chrome" },
                                            { id: "Firefox", text: "Firefox" },
                                            { id: "Edge", text: "Edge" },
                                            { id: "Internet Explorer", text: "Internet Explorer" }
                                        ]}
                                    />
                                </cx>
                            },
                            {
                                header: "OS", field: "os", sortable: true,
                                editor: <cx>
                                    <LookupField
                                        value-bind="$record.os"
                                        required
                                        autoOpen
                                        submitOnEnterKey
                                        options={[
                                            { id: "Mac OS", text: "Mac OS" },
                                            { id: "iOS", text: "iOS" },
                                            { id: "Android", text: "Android" },
                                            { id: "Windows", text: "Windows" },
                                            { id: "Ubuntu", text: "Ubuntu" },
                                        ]}
                                    />
                                </cx>
                            },
                            {
                                header: "Visits",
                                field: "visits",
                                sortable: true,
                                align: "right",
                                editor: <cx>
                                    <NumberField
                                        value-bind="$record.visits"
                                        required
                                        visited
                                        inputStyle="text-align: right"
                                    />
                                </cx>
                            }
                        ]
                    }
                />

                <CodeSnippet putInto="code">{`
                <Grid
                    cellEditable
                    onCellEdited={(change, record) => {
                        console.log(change, record);
                    }}
                    records:bind="$page.records"
                    scrollable
                    buffered
                    style="height: 600px;"
                    lockColumnWidths
                    cached
                    columns={
                        [
                            {header: "#", field: "index", sortable: true, value: {bind: "$index"}},
                            {
                                header: "Name",
                                field: "fullName",
                                sortable: true,
                                editor: <cx>
                                    <TextField
                                        value-bind="$record.fullName"
                                        style="position: absolute; width: 100%; height: 100%; top: 0;"                                        
                                        required
                                        visited
                                    />
                                </cx>
                            },
                            {
                                header: "Continent", field: "continent", sortable: true,
                                editor: <cx>
                                    <Select
                                        value-bind="$record.continent"
                                        style="position: absolute; width: 100%; height: 100%; top: 0;"                                        
                                        required
                                    >
                                        <option value="Africa">Africa</option>
                                        <option value="Antarctica">Antarctica</option>
                                        <option value="Asia">Asia</option>
                                        <option value="Australia">Australia</option>
                                        <option value="Europe">Europe</option>
                                        <option value="North America">North America</option>
                                        <option value="South America">South America</option>
                                    </Select>
                                </cx>
                            },
                            {
                                header: "Browser", field: "browser", sortable: true,
                                editor: <cx>
                                    <LookupField
                                        value-bind="$record.browser"
                                        style="position: absolute; width: 100%; height: 100%; top: 0;"
                                        required
                                        autoOpen
                                        options={[
                                            { id: "Opera", text: "Opera" },
                                            { id: "Safari", text: "Safari" },
                                            { id: "Chrome", text: "Chrome" },
                                            { id: "Firefox", text: "Firefox" },
                                            { id: "Edge", text: "Edge" },
                                            { id: "Internet Explorer", text: "Internet Explorer" }
                                        ]}
                                    />
                                </cx>
                            },
                            {
                                header: "OS", field: "os", sortable: true,
                                editor: <cx>
                                    <LookupField
                                        value-bind="$record.os"
                                        style="position: absolute; width: 100%; height: 100%; top: 0;"
                                        required
                                        autoOpen
                                        options={[
                                            { id: "Mac OS", text: "Mac OS" },
                                            { id: "iOS", text: "iOS" },
                                            { id: "Android", text: "Android" },
                                            { id: "Windows", text: "Windows" },
                                            { id: "Ubuntu", text: "Ubuntu" },
                                        ]}
                                    />
                                </cx>
                            },
                            {
                                header: "Visits",
                                field: "visits",
                                sortable: true,
                                align: "right",
                                editor: <cx>
                                    <NumberField
                                        value-bind="$record.visits"
                                        style="position: absolute; width: 100%; height: 100%; top: 0;"                                       
                                        required
                                        visited
                                        inputStyle="text-align: right"                                        
                                    />
                                </cx>
                            }
                        ]
                    }
                />
                `}</CodeSnippet>
            </CodeSplit>
        </Md>
    </cx>
);
