import {HtmlElement, Content} from 'cx/widgets';
import {Md} from 'docs/components/Md';
import {ImportPath} from 'docs/components/ImportPath';
import {ConfigTable} from '../../components/ConfigTable';
import {CodeSplit} from 'docs/components/CodeSplit';
import {CodeSnippet} from 'docs/components/CodeSnippet';

export const Color = <cx>
    <Md>
        # Color Utils

        Cx util contains the following color utility funcitons:
        - [parseColor](#parsecolor)
        - [parseHexColor](#parsehexcolor)
        - [parseRgbColor](#parsergbcolor)
        - [parseHslColor](#parsehslcolor)
        - [hslToRgb](#hsltorgb)
        - [rgbToHex](#rgbtohex)
        - [rgbToHsl](#rgbtohsl)


        ## parseColor
        <ImportPath path="import {parseColor} from 'cx/util';"/>
        

        ### Definition
        `parseColor: (color: string) => RGBColor | HSLColor;`

        ### Parameters
        
        <ConfigTable header="Parameter" props={{
            color: {
                type: 'string',
                description: <cx><Md>
                    String representing a valid `rgba`, `hsla` or `hex` color value.
                </Md></cx>
            }
        }} />

        ### Return value
        For `hex` and `rgba` string input, it returns  `RGBColor` object with the following properties: `r`, `g`, `b`, `a`, representing the corresponding `rgba` number values, and `type` property equal to `'rgba'`.  
        For `hsla` stiring input, it returns `HSLColor` object with the following properties: `h`, `s`, `l`, `a`, representing the corresponding `hsla` number values, and `type` property equal to `'hsla'`.

        ### Example
        <CodeSplit>
            <CodeSnippet>
                {`
                    parseColor('#e52c2c'); // { type: 'rgba', r: 229, g: 44, b: 44, a: 1 }
                    parseColor('rgba(229,44,44,1)'); // { type: 'rgba', r: 229, g: 44, b: 44, a: 1 }
                    parseColor('hsla(0,78%,54%,1)'); // { type: 'rgba', r: 229, g: 44, b: 44, a: 1 }
                `}
            </CodeSnippet>
        </CodeSplit>
        
        ## parseHexColor
        <ImportPath path="import {parseHexColor} from 'cx/util';"/>
        

        ### Definition
        `parseHexColor: (color: string) => RGBColor;`

        ### Parameters
        
        <ConfigTable header="Parameter" props={{
            color: {
                type: 'string',
                description: <cx><Md>
                    String representing a valid `hex` color value.
                </Md></cx>
            }
        }} />

        ### Return value
        `RGBColor` object as defined above.  

        ### Example
        <CodeSplit>
            <CodeSnippet>
                {`
                    parseHexColor('#e52c2c'); // { type: 'rgba', r: 229, g: 44, b: 44, a: 1 }
                `}
            </CodeSnippet>
        </CodeSplit>
        
        ## parseRgbColor
        <ImportPath path="import {parseRgbColor} from 'cx/util';"/>
        

        ### Definition
        `parseRgbColor: (color: string) => RGBColor;`

        ### Parameters
        <ConfigTable header="Parameter" props={{
            color: {
                type: 'string',
                description: <cx><Md>
                    String representing a valid `rgba` color value.
                </Md></cx>
            }
        }} />

        ### Return value
        `RGBColor` object as defined above.
        
        ### Example
        <CodeSplit>
            <CodeSnippet>
                {`
                    parseRgbColor('rgba(229,44,44,1)'); // { type: 'rgba', r: 229, g: 44, b: 44, a: 1 }
                `}
            </CodeSnippet>
        </CodeSplit>


        ## parseHslColor
        <ImportPath path="import {parseHslColor} from 'cx/util';"/>
        

        ### Definition
        `parseHslColor: (color: string) => HSLColor;`

        ### Parameters
        <ConfigTable header="Parameter" props={{
            color: {
                type: 'string',
                description: <cx><Md>
                    String representing a valid `hsla` color value.
                </Md></cx>
            }
        }} />

        ### Return value
        `HSLColor` object as defined above.
        
        ### Example
        <CodeSplit>
            <CodeSnippet>
                {`
                    parseHslColor('hsla(0,78%,53%,1)'); // { type: 'hsla', h: 0, s: 78, l: 53, a: 1 }
                `}
            </CodeSnippet>
        </CodeSplit>
        
        
        ## hslToRgb
        <ImportPath path="import {hslToRgb} from 'cx/util';"/>

        ### Definition
        `hslToRgb: (h: number, s: number, l: number) => [number, number, number];`

        ### Parameters
        <ConfigTable header="Parameter" sort={false} props={{
            h: {
                type: 'number',
                description: <cx><Md>
                    Number representing a valid *hue* value in `hsla` color format.
                </Md></cx>
            },
            s: {
                type: 'number',
                description: <cx><Md>
                    Number representing a valid *saturation* value in `hsla` color format.
                </Md></cx>
            },
            l: {
                type: 'number',
                description: <cx><Md>
                    Number representing a valid *lightness* value in `hsla` color format.
                </Md></cx>
            }
        }} />

        ### Return value
        Array containing three numbers representing `r`, `g` and `b` values of the `rgba` color format.
        
        ### Example
        <CodeSplit>
            <CodeSnippet>
                {`
                    hslToRgb(0, 0, 100);  // [255, 255, 255]
                `}
            </CodeSnippet>
        </CodeSplit>


        ## rgbToHex
        <ImportPath path="import {rgbToHex} from 'cx/util';"/>
        
        ### Definition
        `rgbToHex: (r: number, g: number, b: number) => string;`

        ### Parameters
        <ConfigTable header="Parameter" sort={false} props={{
            r: {
                type: 'number',
                description: <cx><Md>
                    Number representing a valid *red* value in `rgba` color format.
                </Md></cx>
            },
            g: {
                type: 'number',
                description: <cx><Md>
                    Number representing a valid *green* value in `rgba` color format.
                </Md></cx>
            },
            b: {
                type: 'number',
                description: <cx><Md>
                    Number representing a valid *blue* value in `rgba` color format.
                </Md></cx>
            }
        }} />

        ### Return value
        String representing a valid `hex` color value.

        ### Example
        <CodeSplit>
            <CodeSnippet>
                {`
                    rgbToHex(255, 255, 255);  // '#ffffff'
                `}
            </CodeSnippet>
        </CodeSplit>


        ## rgbToHsl
        <ImportPath path="import {rgbToHsl} from 'cx/util';"/>
        
        ### Definition
        `rgbToHsl: (r: number, g: number, b: number) => [number, number, number];`

        ### Parameters
        <ConfigTable header="Parameter" sort={false} props={{
            r: {
                type: 'number',
                description: <cx><Md>
                    Number representing a valid *red* value in `rgba` color format.
                </Md></cx>
            },
            g: {
                type: 'number',
                description: <cx><Md>
                    Number representing a valid *green* value in `rgba` color format.
                </Md></cx>
            },
            b: {
                type: 'number',
                description: <cx><Md>
                    Number representing a valid *blue* value in `rgba` color format.
                </Md></cx>
            }
        }} />

        ### Return value
        Array containing three numbers representing `h`, `s` and `l` values of the `hsla` color format.

        ### Example
        <CodeSplit>
            <CodeSnippet>
                {`
                    rgbToHsl(255, 255, 255);  // [0, 0, 100]
                `}
            </CodeSnippet>
        </CodeSplit>

    </Md>
</cx>

