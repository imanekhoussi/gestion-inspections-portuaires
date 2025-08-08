// File: src/ol-ext.d.ts

declare module 'ol-ext/control/LayerSwitcher' {
  import { Control } from 'ol/control';
  import { Options } from 'ol/control/Control';
  export default class LayerSwitcher extends Control {
    constructor(options?: Options);
  }
}

declare module 'ol-ext/control/Legend' {
  import { Control } from 'ol/control';
  import Style from 'ol/style/Style';
  interface LegendOptions {
    title?: string;
    collapsible?: boolean;
    margin?: number;
  }
  interface LegendItem {
    title: string;
    style: Style;
  }
  export default class Legend extends Control {
    constructor(options?: LegendOptions);
    add(item: LegendItem): void;
  }
}