import { List, Repeater, Text, Link, Menu, Icon } from 'cx/widgets';
import { KeySelection, History, Url, TreeAdapter } from 'cx/ui';
import { HtmlElement } from 'cx/widgets';

//Deprecated, see ./layout/DocsNav


const onItemClick = (e, { store }) => {
    e.preventDefault();
    e.stopPropagation();
    var record = store.get('$topic');
    if (record.url)
        History.pushState({}, null, Url.resolve(record.url));
    else
        store.set('$topic.expanded', !record.expanded);
    return false;
}

export const SideNav = <cx>
    <List
        class="cxb-sidenav"
        records-bind="contents"
        recordName="$topic"
        adapter={{ type: TreeAdapter, childrenField: 'articles', expandedField: 'expanded' }}
        onItemClick={onItemClick}
        itemClassName={{
            "cxs-selected": { expr: '{url}=={$topic.url}' }
        }}
    >
        <div
            visible-expr="{$topic.$level} == 0"
            trimWhitespace={false}
            class="cxe-sidenav-topic"
        >
            <Text bind="$topic.topic" />
            <Icon
                name="drop-down"
                class={{
                    "cxe-sidenav-arrow": true,
                    "cxs-expanded": { expr: "{$topic.expanded}" }
                }}
            />
        </div>

        <Link
            visible-expr="{$topic.$level} > 0"
            text-bind="$topic.title"
            href-bind="$topic.url"
            url-bind="url"
            match="prefix"
            tabIndex={-1}
            onClick={() => false}
        />

    </List>
</cx>;
