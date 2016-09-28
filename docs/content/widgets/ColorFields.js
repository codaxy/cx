import {Md} from '../../components/Md';
import {CodeSplit} from '../../components/CodeSplit';
import {CodeSnippet} from '../../components/CodeSnippet';
import {ConfigTable} from '../../components/ConfigTable';

import {HtmlElement} from 'cx/ui/HtmlElement';
import {ColorField} from 'cx/ui/form/ColorField';

import configs from './configs/ColorField';

export const ColorFields = <cx>
    <Md>
        # ColorField

        The `ColorPicker` widget is used for selecting colors.

        <CodeSplit>


            <div class="widgets">
                <ColorField value={{bind:"$page.color1", defaultValue:'#f88'}} autoFocus/>

                <div style={{width:'100px', height: '70px', background:{bind:'$page.color1'}}}></div>
            </div>

            <div class="widgets">
                <ColorField value={{bind:"$page.color2", defaultValue:'hsla(360,40%,40%,1'} } format='hsla'/>

                <div style={{width:'100px', height: '70px', background:{bind:'$page.color2'}}}></div>
            </div>

            <CodeSnippet putInto="code">{`
             <div class="widgets">
                <ColorField value={{bind:"$page.color1", defaultValue:'#f88'}} autoFocus />
                <div style={{width:'100px', height: '70px', background:{bind:'$page.color1'}}}></div>
             </div>

             <div class="widgets">
                <ColorField value={{bind:"$page.color2", defaultValue:'#f44'}} autoFocus />
                <div style={{width:'100px', height: '70px', background:{bind:'$page.color2'}}}></div>
             </div>
         `}</CodeSnippet>
        </CodeSplit>


        ## Configuration

        <ConfigTable props={configs}/>

    </Md>
</cx>

