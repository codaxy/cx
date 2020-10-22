import { Md } from '../../../components/Md';
import field from './Field';
import calendar from './Calendar';

let {
    minValue,
    minExclusive,
    maxValue,
    maxExclusive,
    value
} = calendar;

export default {
    minValue,
    minExclusive,
    maxValue,
    maxExclusive,
    value,
    ...field,
    baseClass: {
        type: 'string',
        description: <cx><Md>
            Base CSS class to be applied to the field. Defaults to `datefield`.
        </Md></cx>
    },
    format: {
        type: 'string',
        key: true,
        description: <cx><Md>
            Date format used to display the selected date. See [Formatting](~/concepts/formatting) for more details.
        </Md></cx>
    },
    segment: {
        type: 'string',
        description: <cx><Md>
            Defines which segment of the date/time object is affected by this field.
            Allowed values are `date`, `time` and `datetime`.
        </Md></cx>
    },
    partial: {
        type: 'string',
        key: true,
        description: <cx><Md>
            Preserves date or time segment set by some other field. Useful in Date/Time combos.
        </Md></cx>
    },
    showClear: {
        type: 'string',
        description: <cx><Md>
            Set to `false` to hide the clear button. It can be used interchangeably with the `hideClear` property.
            Default value is `false`.
        </Md></cx>
    },
    alwaysShowClear: {
        type: 'boolean',
        description: <cx><Md>
            Set to `true` to display the clear button even if `required` is set. Default value is `false`.
        </Md></cx>
    },
    hideClear: {
        type: 'boolean',
        description: <cx><Md>
            Set to `true` to hide the clear button. It can be used interchangeably with the `showClear` property.
            Default value is `true`.
        </Md></cx>
    },
    encoding: {
        type: 'function',
        description: <cx>
            <Md>
                Sets the function that will be used to convert Date objects before writing data to the store.
                Default implementation is `Date.toISOString`. See also [Culture.setDefaultDateEncoding](~/concepts/localization#culture).
            </Md>
        </cx>
    },
    autoOpen: {
        type: 'boolean',
        description: <cx><Md>
            Set to `true` to auto open the time picker. Commonly used in cell-editable grids.
        </Md></cx>
    },
    disabledDaysOfWeek: {
        type: 'array',
        description: <cx><Md>
            Defines which days of week should be displayed as disabled, i.e. `[0, 6]` will make Sunday and Saturday unselectable.
        </Md></cx>
    }
};