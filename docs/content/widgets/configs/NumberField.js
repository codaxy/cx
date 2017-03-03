import {Md} from '../../../components/Md';
import field from './Field';

export default {
    ...field,
    format: {
        key: true,
        type: 'string',
        description: <cx><Md>
            Template used to format the value. Examples: `ps` - percentage sign; `n;2` - two decimals.
            By default, number formatting is applied with optional maximum decimal precision.
        </Md></cx>
    },
    value: {
        key: true,
        type: 'number',
        description: <cx><Md>
            Value of the input.
        </Md></cx>
    },
    reactOn: {
        type: 'string',
        description: <cx><Md>
            Defaults to `input`. Other permitted values are `enter` and `blur`. Multiple values should be separated by
            space,
            .e.g. 'enter blur'.
        </Md></cx>
    },
    baseClass: {
        type: 'string',
        description: <cx><Md>
            Base CSS class to be applied to the field. Defaults to `numberfield`.
        </Md></cx>
    },

    increment: {
        key: true,
        alias: 'step',
        type: 'number',
        description: <cx><Md>
            Increment/decrement value when using arrow keys or mouse wheel.
        </Md></cx>
    },
    snapToIncrement: {
        key: true,
        type: 'boolean',
        description: <cx><Md>
            Round values to the nearest tick. Default is `true`.
        </Md></cx>
    },
    incrementPercentage: {
        key: true,
        type: 'number',
        description: <cx><Md>
            Percentage used to calculate the increment when it's not explicitly specified.
            Default value is `0.1` (10%).
        </Md></cx>
    },
    icon: {
        type: 'string',
        description: <cx><Md>
            Name of the icon to be put on the left side of the input.
        </Md></cx>
    }
};