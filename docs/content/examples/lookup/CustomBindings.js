import { HtmlElement, LookupField, Repeater, PureContainer, TextField, NumberField } from 'cx/widgets';
import { Controller, LabelsTopLayout, UseParentLayout } from 'cx/ui';
import {Md} from '../../../components/Md';
import {CodeSplit} from '../../../components/CodeSplit';
import {CodeSnippet} from '../../../components/CodeSnippet';

import {casual} from '../data/casual';

class PageController extends Controller {
    query(q) {
        if (!this.cityDb)
            this.cityDb = Array.from({ length: 100 }).map((_, i) => ({
                id: i+1,
                text: casual.city,
                population: Math.floor(Math.random() * Math.floor(100000)),
                landArea: Math.floor(Math.random() * Math.floor(1000))
            }));

        var regex = new RegExp(q, "gi");
            return new Promise(resolve => {
            setTimeout(
                () => resolve(this.cityDb.filter(x => x.text.match(regex))),
                100
            );
        });
    }
}

export const CustomBindings = <cx>
    <Md controller={PageController}>

        # Custom Bindings

        <CodeSplit>

            Following examples show how to use lookup custom bindings property.

            Single Selection:

            When using custom bindings with a single selection mode key record is mandatory, while text record is optional. Options data are exposed through `$option` alias.

            <div class="widgets" style="align-items: start">
                <div layout={{type: LabelsTopLayout, vertical: true}}>
                    <LookupField
                        label="Select"
                        value:bind="$page.city.id"
                        text:bind="$page.city.name"
                        onQuery="query"
                        bindings={[
                            { key: true, local: "$page.city.id", remote: "$option.id" },
                            { local: "$page.city.name", remote: "$option.text" },
                            { local: "$page.city.population", remote: "$option.population" },
                            { local: "$page.city.landArea", remote: "$option.landArea" }
                        ]}
                    />

                    <PureContainer if-bind="$page.city.id" layout={UseParentLayout}>
                        <TextField value-bind="$page.city.name" label="City:" viewMode style="font-weight: bold" />
                        <NumberField value-bind="$page.city.population" label="Population" viewMode style="font-weight: bold" />
                        <NumberField value-bind="$page.city.landArea" label="Land Area" viewMode style="font-weight: bold" format="suffix; km2" />
                    </PureContainer>
                </div>

                <div layout={{type: LabelsTopLayout, vertical: true}}>
                    <LookupField
                        style="max-width: 300px"
                        label="Multi Select"
                        records-bind="$page.selectedCities"
                        onQuery="query"
                        multiple
                        bindings={[
                            { key: true, local: "$value.id", remote: "$option.id" },
                            { local: "$value.text", remote: "$option.text" },
                            { local: "$value.landArea", remote: "$option.landArea" },
                            { local: "$value.population", remote: "$option.population" }
                        ]}
                    >
                        <h4 text-bind="$option.text" style="margin: 2px 0;" />
                        <span text-tpl="Population: {$option.population}" />
                        <br />
                        <span text-tpl="Land Area: {$option.landArea} km2" />
                    </LookupField>

                    <Repeater records-bind="$page.selectedCities" recordAlias="$city">
                        <div style="border-bottom: 1px solid lightgray; padding: 8px">
                            <h4 text-bind="$city.text" style="margin: 2px 0;" />
                            Population: <NumberField value-bind="$city.population" viewMode />
                            <br />
                            Land Area: <NumberField value-bind="$city.landArea" format="suffix; km2" viewMode />
                        </div>
                    </Repeater>
                </div>
            </div>

            Multi Selection:

            When using custom bindings with a multiple selection mode both key and text records are mandatory. Options data are exposed through `$option` alias, while selection data have to be prefixed with `$value` prefix.

            <CodeSnippet putInto="code" fiddle="5Zp9AfEj">{`
                class PageController extends Controller {
                    query(q) {
                        if (!this.cityDb)
                            this.cityDb = Array.from({ length: 100 }).map((_, i) => ({
                                id: i+1,
                                text: casual.city,
                                population: Math.floor(Math.random() * Math.floor(100000)),
                                landArea: Math.floor(Math.random() * Math.floor(1000))
                            }));

                        var regex = new RegExp(q, "gi");
                            return new Promise(resolve => {
                            setTimeout(
                                () => resolve(this.cityDb.filter(x => x.text.match(regex))),
                                100
                            );
                        });
                    }
                }
                ...
                <div layout={{type: LabelsTopLayout, vertical: true}}>
                    <LookupField
                        label="Select"
                        value:bind="$page.city.id"
                        text:bind="$page.city.name"
                        onQuery="query"
                        bindings={[
                            { key: true, local: "$page.city.id", remote: "$option.id" },
                            { local: "$page.city.name", remote: "$option.text" },
                            { local: "$page.city.population", remote: "$option.population" },
                            { local: "$page.city.landArea", remote: "$option.landArea" }
                        ]}
                    />

                    <PureContainer if-bind="$page.city.id" layout={UseParentLayout}>
                        <TextField value-bind="$page.city.name" label="City:" viewMode style="font-weight: bold"/>
                        <NumberField value-bind="$page.city.population" label="Population" viewMode style="font-weight: bold" />
                        <NumberField value-bind="$page.city.landArea" label="Land Area" viewMode style="font-weight: bold" format="suffix; km2"/>
                    </PureContainer>
                </div>

                <div layout={{type: LabelsTopLayout, vertical: true}}>
                    <LookupField
                        style="max-width: 260px"
                        label="Multi Select"
                        records-bind="$page.selectedCities"
                        onQuery="query"
                        multiple
                        bindings={[
                            { key: true, local: "$value.id", remote: "$option.id" },
                            { local: "$value.text", remote: "$option.text" },
                            { local: "$value.landArea", remote: "$option.landArea" },
                            { local: "$value.population", remote: "$option.population" }
                        ]}
                    >
                        <h4 text-bind="$option.text" style="margin: 2px 0;" />
                        <span text-tpl="Population: {$option.population}" />
                        <br />
                        <span text-tpl="Land Area: {$option.landArea} km2" />
                    </LookupField>

                    <Repeater records-bind="$page.selectedCities">
                        <div style="border-bottom: 1px solid lightgray; padding: 5px">
                            <h3 text-bind="$option.text" style="margin: 2px 0;" />
                            <span text-tpl="Population: {$option.population}" />
                            <br />
                            <span text-tpl="Land Area: {$option.landArea} km2" />
                        </div>
                    </Repeater>
                </div>
                `}</CodeSnippet>
        </CodeSplit>

    </Md>
</cx>
