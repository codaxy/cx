import { cx, Route, RedirectRoute, Section, Link } from "cx/widgets";
import { FirstVisibleChildLayout, bind, tpl, computable } from "cx/ui";
import { SandboxedAsyncRoute } from "../components/asyncRoute";
import { MasterLayout } from "../../misc/layout";
import { NavTree } from "../../misc/components/NavTree";
import { ScrollReset } from "../../misc/components/ScrollReset";
import { ScrollIntoView } from "../../misc/components/ScrollIntoView";

import list from "./list";
import { ThemeLoader } from "../components/ThemeLoader";

let themes = {
   "~/aquamarine": "Aquamarine",
   "~/material": "Material",
   "~/frost": "Frost",
   "~/core": "Core",
   "~/material-dark": "Material Dark",
   "~/space-blue": "Space Blue",
   "~/dark": "Dark",
};

let a = (
   <cx>
      <div />
   </cx>
);

const Test = ({ x, y, z}) => <cx><div /></cx>

export default (
   <cx>
      <Test x y z />
      <MasterLayout
         app="gallery"
         shadow
         navTree={computable("$themeRoute.theme", (theme) => [
            {
               url: `~/${theme}`,
               text: themes[`~/${theme}`],
               children: list.map((cat) => ({
                  text: cat.name,
                  children: cat.items?.map((item) => ({
                     url: item.route.replace("+/", `~/${theme}/`),
                     text: item.name,
                  })),
               })),
            },
         ])}
         title="Gallery"
         topLinks={themes}
      >
         <ScrollReset trigger={bind("url")} />
         <div class="fullheight master_content">
            <RedirectRoute route="~/" url={bind("url")} redirect="~/aquamarine" />
            <Route route="~/:theme" url={bind("url")}>
               <RedirectRoute
                  redirect={computable(
                     "$themeRoute.remainder",
                     "$route.theme",
                     (remainder, theme) => `~/${theme || "aquamarine"}${remainder || "/button/states"}`
                  )}
               />
            </Route>
            <Route route="~/:theme" url={bind("url")} prefix recordName="$themeRoute">
               <ScrollIntoView {...{ className: "gray sticky standalone sidenav", selector: ".cxb-link.cxs-active" }}>
                  <NavTree
                     tree={computable("$themeRoute.theme", (theme) => [
                        {
                           url: `~/${theme}`,
                           text: theme,
                           children: list.map((cat) => ({
                              text: cat.name,
                              children: cat.items?.map((item) => ({
                                 url: item.route,
                                 text: item.name,
                              })),
                           })),
                        },
                     ])}
                     url={bind("url")}
                  />
               </ScrollIntoView>
               <ThemeLoader theme={bind("$themeRoute.theme")}>
                  <main class="main" layout={FirstVisibleChildLayout}>
                     {list.map((cat) =>
                        cat.items?.map((item) => <SandboxedAsyncRoute route={item.route} content={item.content} />)
                     )}
                     <Section title="Page Not Found" mod="card">
                        This page doesn't exists. Please check your URL.
                     </Section>
                  </main>
               </ThemeLoader>
            </Route>
         </div>
      </MasterLayout>
   </cx>
);
