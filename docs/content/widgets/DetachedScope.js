import {HtmlElement, IsolatedScope, TextField} from 'cx/widgets';
import {LabelsLeftLayout} from 'cx/ui';
import {Md} from '../../components/Md';
import {CodeSplit} from '../../components/CodeSplit';
import {CodeSnippet} from '../../components/CodeSnippet';
import {ConfigTable} from '../../components/ConfigTable';
import {ImportPath} from '../../components/ImportPath';


import configs from './configs/DetachedScope';

export const DetachedScopePage = <cx>
    <Md>
        # DetachedScope

        <ImportPath path="import {DetachedScope} from 'cx/widgets';"/>

        The `DetachedScope` is a component used exclusively to improve performance by detaching
        certain areas from the rest of the page. Detached content render in their own render cycles and use
        a data declaration which explains which changes can go in or out. This is commonly used to ensure optimal performance
        with rich popups, grids, charts and other interactive structures that might be negatively affected by
        other "heavy" elements visible on the page.

        <CodeSplit>

            <div class="widgets">
                <IsolatedScope bind="$page.scope1">
                    <div style="width: 150px; height: 150px; background: #d4d4d4; padding: 20px">
                        Heavy duty contents 1
                    </div>
                </IsolatedScope>

                <IsolatedScope bind="$page.scope2">
                    <div style="width: 150px; height: 150px; background: #d4d4d4; padding: 20px">
                        Heavy duty contents 2
                    </div>
                </IsolatedScope>
            </div>

            <CodeSnippet putInto="code">{`
                <IsolatedScope bind="$page.scope1">
                    <div style="width: 150px; height: 150px; background: #d4d4d4; padding: 20px">
                        Heavy duty contents 1
                    </div>
                </IsolatedScope>

                <IsolatedScope bind="$page.scope2">
                    <div style="width: 150px; height: 150px; background: #d4d4d4; padding: 20px">
                        Heavy duty contents 2
                    </div>
                </IsolatedScope>
            `}</CodeSnippet>
        </CodeSplit>

        ## Configuration

        <ConfigTable props={{...configs, mod: false}}/>

    </Md>
</cx>

