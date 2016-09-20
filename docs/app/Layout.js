import {ContentPlaceholder} from 'cx/ui/layout/ContentPlaceholder';
import {HtmlElement} from 'cx/ui/HtmlElement';
import {SearchWindow} from 'docs/components/SearchWindow';
import {CSS} from './CSS';

export const Layout = <cx>
   <div class={CSS.block('layout')}>
       <div class={{
           "dxe-layout-menu": true
       }}
       onClick={(e, {store})=>{store.toggle('layout.navOpen')}}></div>
       <div class={{
           "dxe-layout-content": true,
           'dxs-navopen': { bind: 'layout.navOpen' }
        }}>
          <aside>
             <header>
                <h1 style="cursor: zoom-in"
                    onClick={(e, {store}) => { store.set('search.visible', true)}}>Cx Docs</h1>
             </header>
             <div class={CSS.element('layout', 'hiddenscroll')}>
                <ContentPlaceholder name="aside" />
             </div>
          </aside>
          <ContentPlaceholder />
       </div>
       <SearchWindow />
   </div>
</cx>;


