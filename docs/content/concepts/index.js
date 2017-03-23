export * from './DataBinding';
export * from './DataViews';
export * from './Controllers';
export * from './Widgets';
export * from './Selections';
export * from './Layouts';
export * from './Css';
export * from './Router';
export * from './Formatting';
export * from './Charts';
export * from './Localization';
export * from './Store';


import { bumpVersion } from '../version';

//HMR
if (module.hot) {
    module.hot.accept();
    bumpVersion();
}

