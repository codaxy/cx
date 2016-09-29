import {Md} from '../../components/Md';
import {CodeSplit} from '../../components/CodeSplit';
import {CodeSnippet} from '../../components/CodeSnippet';
import {ConfigTable} from '../../components/ConfigTable';

import {HtmlElement} from 'cx/ui/HtmlElement';

import {Svg} from 'cx/ui/svg/Svg';
import {Rectangle} from 'cx/ui/svg/Rectangle';
import {ClipRect} from 'cx/ui/svg/ClipRect';
import {Ellipse} from 'cx/ui/svg/Ellipse';
import {Text} from 'cx/ui/svg/Text';

import configs from './configs/BoundedObject';

export const ClipRects = <cx>
    <Md>
        # ClipRect

        <CodeSplit>

            The `ClipRect` widget can be used to clip the inner contents.

            <div class="widgets">
                <Svg style="width:200px;height:200px;background:white;margin:5px">
                    <ClipRect margin={15}>
                        <Ellipse margin={-10} fill="red" />
                    </ClipRect>
                </Svg>
            </div>

            <CodeSnippet putInto="code">{`
            <div class="widgets">
                <Svg style="width:200px;height:200px;background:white;margin:5px">
                    <ClipRect margin={15}>
                        <Ellipse margin={-10} fill="red" />
                    </ClipRect>
                </Svg>
            </div>
            `}</CodeSnippet>
        </CodeSplit>

        ## Configuration

        <ConfigTable props={configs}/>

    </Md>
</cx>

