import {Md} from '../../../components/Md';

import widget from './Widget';
import classAndStyle from './classAndStyle';

export default {
    ...widget,
    ...classAndStyle,
    records: {
        type: 'array',
        key: true,
        description: <cx><Md>
            An array of records to be displayed in the list.
        </Md></cx>
    },
    recordAlias: {
        type: 'string',
        key: true,
        alias: 'recordName',
        description: <cx><Md>
            Alias used to expose record data. Defaults to `$record`.
        </Md></cx>
    },
    indexAlias: {
        type: 'string',
        key: true,
        alias: 'indexName',
        description: <cx><Md>
            Alias used to expose record index. Defaults to `$index`.
        </Md></cx>
    },
    sortField: {
        type: 'string',
        key: true,
        description: <cx><Md>
            A binding used to store the name of the field used for sorting the collection. 
            Available only if `sorters` are not used.
        </Md></cx>
    },
    sortDirection: {
        type: 'string',
        key: true,
        description: <cx><Md>
            A binding used to store the sort direction. Available only if `sorters` are not used.
            Possible values are `"ASC"` and `"DESC"`. Deafults to `"ASC"`.
        </Md></cx>
    },
    sorters: {
        type: 'array',
        key: true,
        description: <cx><Md>
            A binding used to store the sorting order list. 
            This should be an array of objects with `field` and `direction` properties
            (equivalent to `sortField` and `sortDirection` properties).
        </Md></cx>
    },
    selection: {
        type: 'config',
        key: true,
        description: <cx><Md>
            Selection configuration. See [Selections](~/concepts/selections) for more details.
        </Md></cx>
    },
    grouping: {
        type: 'config',
        key: true,
        description: <cx><Md>
            Grouping configuration. Check [the example](~/examples/list/grouping) for more information.
        </Md></cx>
    },
};
