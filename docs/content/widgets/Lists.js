import {HtmlElement, Text, List, MsgBox} from 'cx/widgets';
import {Controller, PropertySelection} from 'cx/ui';
import {Md} from '../../components/Md';
import {CodeSplit} from '../../components/CodeSplit';
import {CodeSnippet} from '../../components/CodeSnippet';
import {ConfigTable} from '../../components/ConfigTable';
import {ImportPath} from '../../components/ImportPath';


import configs from './configs/List';

class PageController extends Controller {
   onInit() {
        this.store.init('$page.records', Array.from({length: 5}).map((x, i) => ({
            text: `${i + 1}`
        })));
    }
}


export const Lists = <cx>
    <Md controller={PageController}>
        # Lists

        <ImportPath path="import {List} from 'cx/widgets';"/>

        <CodeSplit>

            The `List` control displays a collection of items and offers navigation and selection.

            <div class="widgets">
                <List
                    records:bind="$page.records"
                    selection={PropertySelection}
                    style="width:200px"
                    emptyText="Nothing results found."
                    mod="bordered"
                    onItemDoubleClick={(e, {store}) => { MsgBox.alert(store.get('$record.text')) }}
                >
                    <div>
                        <strong>Header <Text expr="{$index}+1"/></strong>
                    </div>
                    Description
                </List>
            </div>

            Examples:

            * [Grouping](~/examples/list/grouping)

            <CodeSnippet putInto="code" fiddle="WBK5QrGZ">{`
            class PageController extends Controller {
               onInit() {
                  this.store.init('$page.records', Array.from({length: 5}, (x, i)=>({
                     text: \`\${i+1}\`
                  })));
               }
            }
            ...
            <List
                records:bind="$page.records"
                selection={PropertySelection}
                style="width:200px"
                emptyText="Nothing results found."
                mod="bordered"
                onItemDoubleClick={(e, {store}) => { MsgBox.alert(store.get('$record.text')) }}
            >
                <div>
                    <strong>Header <Text expr="{$index}+1"/></strong>
                </div>
                Description
            </List>
         `}</CodeSnippet>
        </CodeSplit>

        ## Configuration

        <ConfigTable props={configs}/>

    </Md>
</cx>;

