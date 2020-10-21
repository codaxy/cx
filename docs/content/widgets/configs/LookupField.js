import { Md } from '../../../components/Md';
import field from './Field';

export default {
    ...field,
    value: {
        type: 'number/string',
        key: true,
        description: <cx><Md>
            Selected value. Used only if `multiple` is set to `false`.
        </Md></cx>
    },
    text: {
        type: 'string',
        key: true,
        description: <cx><Md>
            Text associated with the selection. Used only if `multiple` is set to `false`.
        </Md></cx>
    },
    records: {
        type: 'array',
        key: true,
        description: <cx><Md>
            A list of selected records. Used only if `multiple` is set to `true`.
        </Md></cx>
    },
    values: {
        type: 'array',
        key: true,
        description: <cx><Md>
            A list of selected ids. Used only if `multiple` is set to `true`.
        </Md></cx>
    },
    options: {
        type: 'array',
        key: true,
        description: <cx><Md>
            A list of available options.
        </Md></cx>
    },
    multiple: {
        type: 'boolean',
        key: true,
        description: <cx><Md>
            Defaults to `false`. Set to `true` to enable multiple selection.
        </Md></cx>
    },
    minQueryLength: {
        type: 'number',
        description: <cx><Md>Number of characters required to start the search. Default `0`.</Md></cx>
    },
    hideSearchField: {
        type: 'boolean',
        description: <cx><Md>Set to `true` to hide the search field.</Md></cx>
    },

    minOptionsForSearchField: {
        type: 'number',
        description: <cx><Md>Number of options required to show the search field.
            If there are only a few options, there is no need for search. Defaults to `7`.</Md></cx>
    },

    valueIdField: {
        type: 'string',
        key: true,
        description: <cx><Md>Available only in `multiple` selection mode and without custom `bindings`.
            Name of the field to store id of the selected value. Default value is `id`.</Md></cx>
    },

    valueTextField: {
        type: 'string',
        key: true,
        description: <cx><Md>Available only in `multiple` selection mode. Name of the field to store display text of the
        selected value.
            Default value is `text`.</Md></cx>
    },

    optionIdField: {
        type: 'string',
        key: true,
        description: <cx><Md>Name of the field which holds the id of the option. Default value is `id`.</Md></cx>
    },

    optionTextField: {
        type: 'string',
        key: true,
        description: <cx><Md>Name of the field which holds the display text of the option. Default value is `text`.</Md>
        </cx>
    },

    baseClass: {
        type: 'string',
        description: <cx><Md>
            Base CSS class to be applied to the field. Defaults to `lookupfield`.
        </Md></cx>
    },

    dropdownOptions: {
        type: 'config',
        description: <cx><Md>
            Additional configuration to be passed to the dropdown, such as `style`, `positioning`, etc.
        </Md></cx>
    },
    fetchAll: {
        key: false,
        type: 'boolean',
        description: <cx><Md>
            If `true` `onQuery` will be called only once to fetch all options.
            After that options are filtered client-side.
        </Md></cx>
    },
    cacheAll: {
        type: 'boolean',
        key: false,
        description: <cx><Md>
            If this flag is set along with `fetchAll`, fetched options
            are cached for the lifetime of the widget. Otherwise, data is fetched
            whenever the dropdown is shown.
        </Md></cx>
    },
    closeOnSelect: {
        type: 'boolean',
        description: <cx><Md>
            Close the dropdown after selection. Default is `true`.
        </Md></cx>
    },
    showClear: {
        type: 'boolean',
        description: <cx><Md>
            Set to `false` to hide the clear button. It can be used interchangeably with the `hideClear` property.
            No effect if `multiple` is used. Default value is `true`.
        </Md></cx>
    },
    alwaysShowClear: {
        type: 'boolean',
        description: <cx><Md>
            Set to `true` to display the clear button even if `required` is set. Default is `false`.
        </Md></cx>
    },
    hideClear: {
        type: 'boolean',
        description: <cx><Md>
            Set to `true` to hide the clear button. It can be used interchangeably with the `showClear` property.
            No effect if `multiple` is used. Default value is `false`.
        </Md></cx>
    },
    queryDelay: {
        type: 'number',
        description: <cx><Md>
            A delay in milliseconds between the moment the user stops typing and when tha query is made. Default value is `150`.
        </Md></cx>
    },
    bindings: {
        type: 'array',
        description: <cx><Md>
            An array of mappings between options and value fields. Use this property to pass additional options to the selection.
            [See example](~/examples/lookup/custom-bindings).
        </Md></cx>
    },
    sort: {
        type: 'boolean',
        description: <cx><Md>
            Set to `true` to sort drop-down options.
        </Md></cx>
    },
    listOptions: {
        type: 'config',
        description: <cx><Md>
            Options that will be passed to the List widget inside the drop-down.
        </Md></cx>
    },

    autoOpen: {
        type: 'boolean',
        description: <cx><Md>
            Set to `true` to auto open the drop-down. Commonly used in cell-editable grids.
        </Md></cx>
    },

    submitOnEnterKey: {
        type: 'config',
        description: <cx><Md>
            Set to `true` to allow enter key events to be propagated. This is useful for submitting forms and closing grid cell editors.
        </Md></cx>
    },

    submitOnDropdownEnterKey: {
        type: 'config',
        description: <cx><Md>
            Set to `true` to allow dropdown enter key events to be propagated. This is useful for submitting forms on dropdown enter key selection.
        </Md></cx>
    },

    emptyValue: {
        type: 'any',
        description: <cx><Md>
            Value to be written in the store when the field is empty. Default value is `null`;
        </Md></cx>
    }
};