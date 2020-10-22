import {Md} from '../../../components/Md';
import field from './Field';

export default {
    ...field,
    icon: false,
    showClear: false,
    hideClear: false,
    value: {
        type: 'string/Date',
        key: true,
        description: <cx><Md>
            Selected date. This should be a `Date` object or a valid date string consumable by `Date.parse` function.
        </Md></cx>
    },
    refDate: {
        type: 'string/Date',
        key: true,
        description: <cx><Md>
            View reference date. If no date is selected, this date is used to determine which month to show in the
            calendar.
        </Md></cx>
    },
    baseClass: {
        type: 'string',
        description: <cx><Md>
            Base CSS class to be applied to the calendar. Defaults to `calendar`.
        </Md></cx>
    },
    highlightToday: {
        type: 'boolean',
        description: <cx><Md>
            Highlight today's date. Default is `true`.
        </Md></cx>
    },
    minValue: {
        type: 'string/Date',
        description: <cx><Md>
            Minimum date value. This should be a `Date` object or a valid date string consumable by `Date.parse` function.
        </Md></cx>
    },
    minExclusive: {
        type: 'boolean',
        description: <cx><Md>
            Set to `true` to disallow the `minValue`. Default value is `false`.
        </Md></cx>
    },
    maxValue: {
        type: 'string/Date',
        description: <cx><Md>
            Maximum date value. This should be a `Date` object or a valid date string consumable by `Date.parse` function.
        </Md></cx>
    },
    maxExclusive: {
        type: 'boolean',
        description: <cx><Md>
            Set to `true` to disallow the `maxValue`. Default value is `false`.
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
    showTodayButton: {
        type: 'boolean',
        description: <cx>
            <Md>
            Set to `true` to show the button for quickly selecting today's date. Default value is `false`.
            </Md>
        </cx>
    },
    todayButtonText: {
        type: 'string',
        description: <cx>
            <Md>
            Localizable text for the todayButton. Defaults to `"Today"`.
            </Md>
        </cx>
    },
    disabledDaysOfWeek: {
        type: 'array',
        description: <cx><Md>
            Defines which days of week should be displayed as disabled, i.e. `[0, 6]` will make Sunday and Saturday unselectable.
        </Md></cx>
    }
};