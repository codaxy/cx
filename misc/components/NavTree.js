import { Repeater, Link } from "cx/widgets";
import { createFunctionalComponent, computable, DataProxy } from "cx/ui";
import { ref } from "cx/hooks";

export const NavTree = createFunctionalComponent(
   ({ tree, url, showCategory }) => {
      let treeRef = ref(tree);
      let urlRef = ref(url);

      let visibleNode = computable(treeRef, urlRef, (tree, url) => {
         let node =
            tree && tree?.find(item =>
               item.url && (url.startsWith(item.url) ||
                  item.alternativeUrls?.some(alt => url.startsWith(alt))
               ));
         return node || { children: [] };
      });

      return (
         <cx>
            <div
               class="sidenav_category"
               visible={data => showCategory && !!visibleNode(data).text}
            >
               <Link
                  href={data => visibleNode(data).href}
                  text={data => visibleNode(data).text}
                  url="dummy"
               />
            </div>
            <Repeater
               records={data => visibleNode(data).children}
               recordAlias="$group"
            >
               <div text-bind="$group.text" class="sidenav_group" />
               <Repeater records-bind="$group.children" recordAlias="$item">
                  <Link
                     href-bind="$item.url"
                     url={url}
                     text-bind="$item.text"
                  />
               </Repeater>
            </Repeater>
         </cx>
      );
   }
);
