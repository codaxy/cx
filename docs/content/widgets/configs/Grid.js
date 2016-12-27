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
            An array of records to be displayed in the grid.
        </Md></cx>
    },
    sorters: {
        type: 'array',
        key: true,
        description: <cx><Md>
            A binding used to store the sorting order list. Commonly used for server-side sorting.
        </Md></cx>
    },
    sortField: {
        type: 'string',
        key: true,
        description: <cx><Md>
            A binding used to store the name of the field used for sorting grids. Available only if `sorters` are not
            used.
        </Md></cx>
    },
    sortDirection: {
        type: 'string',
        key: true,
        description: <cx><Md>
            A binding used to store the sort direction. Available only if `sorters` are not used.
        </Md></cx>
    },
    scrollable: {
        type: 'bool',
        key: true,
        description: <cx><Md>
            Set to `true` to add a vertical scroll and a fixed header to the grid.
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
        type: 'array',
        key: true,
        description: <cx><Md>
            An array of grouping level definitions. Check allowed grouping level properties in the section below.
        </Md></cx>
    },
    columns: {
        type: 'array',
        key: true,
        description: <cx><Md>
            An array of columns. Check column configuration options in the section below.
        </Md></cx>
    },
    lockColumnWidths: {
        type: 'boolean',
        description: <cx><Md>
            Set to true to lock column widths after the first render. This is helpful in pagination scenarios to
            maintain consistent looks across pages.
        </Md></cx>
    },
    defaultSortField: {
        type: 'string',
        key: false,
        description: <cx><Md>
            Default sort field. Used if neither `sortField` or `sorters` are set.
        </Md></cx>
    },
    defaultSortDirection: {
        type: 'string',
        key: false,
        description: <cx><Md>
            Default sort direction.
        </Md></cx>
    },
    emptyText: {
        type: 'string',
        key: false,
        description: <cx><Md>
            Text to be displayed instead of an empty table.
        </Md></cx>
    },
    border: {
        type: 'boolean',
        key: true,
        description: <cx><Md>
            Set to `true` to add default border around the table. Automatically set if
            grid is `scrollable`.
        </Md></cx>
    },
    vlines: {
        type: 'boolean',
        key: true,
        description: <cx><Md>
            Set to `true` to add vertical gridlines.
        </Md></cx>
    },
    headerMode: {
        type: 'string',
        key: true,
        description: <cx><Md>
            Determines header appearance. Supported values
            are `plain` and `default`. Default mode is used if some of the columns
            are sortable. Plain mode better suits reports and other scenarios in which
            users do not interact with the grid.
        </Md></cx>
    }
};
