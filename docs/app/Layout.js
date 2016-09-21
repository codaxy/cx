import {ContentPlaceholder} from 'cx/ui/layout/ContentPlaceholder';
import {HtmlElement} from 'cx/ui/HtmlElement';
import {SearchWindow} from 'docs/components/SearchWindow';
import {CSS} from './CSS';

const toggleMenu = (e, {store})=> { store.toggle('layout.navOpen') };

const openSearch = (e, {store}) => { store.set('search.visible', true) };

const closeMenuOnSmallScreens = (e, {store}) => {
  if (window.innerWidth < 1000) {
      store.set('layout.navOpen', false);
  }
};

export const Layout = <cx>
    <div class={{
        "dxb-layout": true,
        'dxs-navopen': {bind: 'layout.navOpen'}
    }}>
        <div class="dxe-layout-menu" onClick={toggleMenu}><i class="fa fa-bars"/></div>

        <div class="dxe-layout-search" onClick={openSearch}>
            <i class="fa fa-search"/>
        </div>

        <aside class="dxe-layout-aside">
            <header class="dxe-layout-aside-header">
                <h1 style="cursor: zoom-in">Cx Docs</h1>
            </header>
            <div class="dxe-layout-aside-noscroll">
                <ContentPlaceholder name="aside"/>
            </div>
        </aside>

        <main class="dxe-layout-content" onClick={closeMenuOnSmallScreens}>
            <ContentPlaceholder />
        </main>

        <SearchWindow />
    </div>
</cx>;


