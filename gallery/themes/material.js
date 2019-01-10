import style from "./material.useable.scss";
import {registerTheme} from './index';

import {applyThemeOverrides} from "cx-theme-material";

registerTheme("material", style, applyThemeOverrides);