import { Md } from 'docs/components/Md';

import boundedObject from '../../svg/configs/BoundedObject';

export default {
    ...boundedObject,
    angle: {
        key: true,
        type: 'number',
        description: <cx><Md>
            Angle in degrees. Default is `360` which represents the full circle.
      </Md></cx>
    },
    startAngle: {
        key: true,
        type: 'number',
        description: <cx><Md>
            Start angle in degrees. Indicates the starting point of the first stack. Default is `0`.
      </Md></cx>
    },
    clockwise: {
        key: true,
        type: 'boolean',
        description: <cx><Md>
            When set to `true`, stacks are rendered in clock wise direction.
      </Md></cx>
    },
    class: false,
    style: false,
    preserveWhitespace: false,
    trimWhitespace: false,
    plainText: false
};
