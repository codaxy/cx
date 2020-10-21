import { Button, DocumentTitle, PureContainer } from "cx/widgets";
import { ContentRouter } from "../content/ContentRouter";
import { MasterLayout } from "../../misc/layout";
import { NavTree } from "../../misc/components/NavTree";
import { docsNavTree } from "./DocsNav";
import { ScrollIntoView } from "../../misc/components/ScrollIntoView";
import { SearchWindow } from '../components/SearchWindow';
import Controller from "./Controller";


export const Main = (
    <cx>
        <MasterLayout
            app="docs"
            topLinks={{
                "~/intro": "Intro",
                "~/concepts": "Concepts",
                "~/widgets": "Widgets",
                "~/charts": "Charts",
                "~/examples": "Examples"
            }}
            alternativeLinks={{
                "~/charts": ["~/svg"],
            }}
            title="Documentation"
            navTree={docsNavTree}
            controller={Controller}
        >
            <DocumentTitle text="CxJS Docs" />
            <PureContainer putInto="topbanner">
                <Button
                    icon="binoculars"
                    mod="hollow"
                    style="margin-left: 8px; opacity: 0.9"
                    onClick={(e, { store }) => { store.set("search.visible", true) }}
                />
            </PureContainer>
            <SearchWindow />
            <div class="master_content">
                <ScrollIntoView
                    class={{
                        gray: true,
                        sticky: true,
                        sidenav: true,
                        standalone: true,
                        extended: () => {
                            let scrollingElement = document.scrollingElement || document.documentElement;
                            return scrollingElement.scrollHeight > scrollingElement.clientHeight;
                        }
                    }}
                    selector=".cxb-link.cxs-active"
                >
                    <div class="navtree_container">
                        <NavTree tree={docsNavTree} url-bind="url" />
                    </div>
                </ScrollIntoView>
                <div class="docscontent">
                    <ContentRouter />
                </div>
            </div>
        </MasterLayout>
    </cx>
);
