import { computable } from 'cx/ui';
import { PrivateStore, Rescope, Slider } from 'cx/widgets';
import { CodeSnippet } from 'docs/components/CodeSnippet';
import { CodeSplit } from 'docs/components/CodeSplit';
import { ImportPath } from 'docs/components/ImportPath';
import { Md } from 'docs/components/Md';
import { ConfigTable } from '../../components/ConfigTable';
import config from './configs/PrivateStore';

export const PrivateStores = <cx>
    <Rescope bind="$page">
        <Md>
            # Private Store

            <ImportPath path="import { PrivateStore } from 'cx/widgets';" />

            <CodeSplit>
                `PrivateStore` allows a part of the widget tree to work with a separate data store, isolated from the global store. 
                This way multiple components can use the same bindings that can have different values between the stores.

                In the example below, each [Slider](~/widgets/sliders) is storing its value under the same binding (`slider`). But each `slider` binding
                can have a different value within its own data store. You can test this by moving the sliders. 
                Sliders that are within the same `PrivateStore` will show the same values.

                <div class="widgets">  
                    <div class="flex-column">
                        <Slider value-bind="slider" label="Global store" />
                        <Slider value-bind="slider" label="Global store" />
                    </div>
                    <PrivateStore detached>
                        <div class="flex-column">
                            <Slider value-bind="slider" label="Private store A" />
                            <Slider value-bind="slider" label="Private store A" />
                        </div> 
                    </PrivateStore>
                    <PrivateStore detached>
                        <div class="flex-column">
                            <Slider value-bind="slider" label="Private store B" />
                            <Slider value-bind="slider" label="Private store B" />
                        </div> 
                    </PrivateStore>
                </div>

                <CodeSnippet putInto="code" /* fiddle="F3RHqb0x" */>{`
                    <div class="widgets">  
                        <div class="flex-column">
                            <Slider value-bind="slider" label="Global store" />
                            <Slider value-bind="slider" label="Global store" />
                        </div>
                        <PrivateStore>
                            <div class="flex-column">
                                <Slider value-bind="slider" label="Private store A" />
                                <Slider value-bind="slider" label="Private store A" />
                            </div> 
                        </PrivateStore>
                        <PrivateStore>
                            <div class="flex-column">
                                <Slider value-bind="slider" label="Private store B" />
                                <Slider value-bind="slider" label="Private store B" />
                            </div> 
                        </PrivateStore>
                    </div>
                `}</CodeSnippet>
            </CodeSplit>

            Private stores have the lifespan of the `PrivateStore` component, meaning each time 
            a `PrivateStore` components is destroyed, the data is lost. 
            This can be observed if you move the sliders, navigate to another page and come back again. 
            Only the sliders within the global store will be in the same position as before, while the others will be in their starting positions.

            <CodeSplit>
                ## Sharing data between the stores

                Data shared beetween the parent (in this case global) store and the child store must be explicitly defined with the `data` property.
                `data` is an object whose property names represent the internal bindings under which the property values are made available within the `PrivateStore`.
                In the example below, `slider` binding from the global store is available as `globalValue` binding within the `PrivateStore`.
            
                <div class="widgets flex-row flex-start">  
                    <div class="flex-column">
                        <strong>Global store</strong>
                        <Slider value-bind="slider" label="Global value" />
                    </div>
                    <PrivateStore
                        data={{
                            globalValue: { bind: "slider" },
                        }}
                    >
                        <div class="flex-column">
                            <strong>Private store</strong>
                            <Slider value-bind="globalValue" label="Global value" />
                            <Slider value-bind="slider" label="Private value" />
                        </div> 
                    </PrivateStore>
                </div>

                <CodeSnippet putInto="code" /* fiddle="F3RHqb0x" */>{`
                    <div class="widgets flex-row flex-start">  
                        <div class="flex-column">
                            <strong>Global store</strong>
                            <Slider value-bind="slider" label="Global value" />
                        </div>
                        <PrivateStore
                            data={{
                                globalValue: { bind: "slider" },
                            }}
                        >
                            <div class="flex-column">
                                <strong>Private store</strong>
                                <Slider value-bind="globalValue" label="Global value" />
                                <Slider value-bind="slider" label="Private value" />
                            </div> 
                        </PrivateStore>
                    </div>
                `}</CodeSnippet>

            </CodeSplit>
            Property values can be primitives, bindings, expressions or computables.

            <CodeSplit>
                ### Read-only values

                Primitives, expressions and computables defined in the `data` object are treated as read-only.
                This means, data will flow only in one direction, from parent to child store. You can test this by 
                trying to move one of the sliders within the `PrivateStore`.
            
                <div class="widgets flex-row flex-start">  
                    <div class="flex-column">
                        <strong>Global store</strong>
                        <Slider value-bind="slider" label="Global value" />
                    </div>
                    <PrivateStore
                        data={{
                            // read-only values
                            globalValueExpr: { expr: "{slider}" },
                            primitiveValue: 33,
                            computedValue: computable("slider", (slider) => 100 - slider)
                        }}
                    >
                        <div class="flex-column">
                            <strong>Private store</strong>
                            <Slider value-bind="globalValueExpr" label="Global value" />
                            <Slider value-bind="primitiveValue" label="Primitive value" />
                            <Slider value-bind="computedValue" label="Computed value" />
                        </div> 
                    </PrivateStore>
                </div>

                <CodeSnippet putInto="code" /* fiddle="F3RHqb0x" */>{`
                     <div class="widgets flex-row flex-start">  
                        <div class="flex-column">
                            <strong>Global store</strong>
                            <Slider value-bind="slider" label="Global value" />
                        </div>
                        <PrivateStore
                            data={{
                                // read-only values
                                globalValueExpr: { expr: "{slider}" },
                                primitiveValue: 33,
                                computedValue: computable("slider", (slider) => 100 - slider)
                            }}
                        >
                            <div class="flex-column">
                                <strong>Private store</strong>
                                <Slider value-bind="globalValueExpr" label="Global value" />
                                <Slider value-bind="primitiveValue" label="Primitive value" />
                                <Slider value-bind="computedValue" label="Computed value" />
                            </div> 
                        </PrivateStore>
                    </div>
                `}</CodeSnippet>
            </CodeSplit>

            Attemting to change `PrivateStore's` read-only values will log an error to the console, so the UI should prevent it.

            ## Performance improvements

            `PrivateStore` can also be used for performance improvements since it supports some advanced features such es 
            deferred rendering and seperate (detached) render loop. 

            ### Detached render loop

            If `detached` attribute is used, `PrivateStore` contents is rendered in its own render loop. A `data` declaration 
            is used to determine which changes can go in or out. 
            This means private data changes will not cause the main render loop to run, and vice versa, any change of global data that is not used 
            within `PrivateStore` will not cause its subtree to re-render. This can be observed with the use of 
            [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en), by enabling
            the [Highlight Updates](https://reactjs.org/docs/optimizing-performance.html#avoid-reconciliation) feature.  

            In most cases you should use this feature, as it can significantly improve performance. Be aware however that it may break some advanced Cx features, 
            that depend on the use of shared `context`. A typical example where this occures is with the use of layouts.

            ### Deferred rendering

            By using `deferredUntilIdle` flag, we can defer the render of the `PrivateStore's` subtree for a certain time limit (`idleTimeout`), or until the browser is idle.
            This can be very useful, for example, when loading a page with a lot of heavy content, so it helps breaiking it up into smaller
            chunks the browser can defer rendering until idle, or the user is inactive. In the background, `deferredUntilIdle` uses 
            [`requestIdleCallback`](https://developers.google.com/web/updates/2015/08/using-requestidlecallback) API. 

            ## Configuration

            <ConfigTable props={config} />
        </Md>
    </Rescope>
</cx>