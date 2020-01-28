interface Item {
   name: string;
   route?: string;
   content?: () => Promise<any>;
   items?: Item[];
}

let list: Item[] = [
   {
      name: "General",
      items: [
         {
            name: "Button",
            route: "+/button",
            content: () => import("./general/button/states")
         },
         {
            route: "+/tab",
            name: "Tab",
            content: () => import("./general/tab")
         },
         {
            route: "+/menu",
            name: "Menu",
            content: () => import("./general/menu/states")
         },
         {
            route: "+/list",
            name: "List",
            content: () => import("./general/list/states")
         },
         {
            route: "+/window",
            name: "Window",
            content: () => import("./general/window/states")
         },
         {
            route: "+/toast",
            name: "Toast",
            content: () => import("./general/toast/states")
         },
         {
            route: "+/section",
            name: "Section",
            content: () => import("./general/section/states")
         },
         {
            route: "+/progressbar",
            name: "ProgressBar",
            content: () => import("./general/progressbar/states")
         }
      ]
   },
   {
      name: "Grid",
      items: [
         {
            name: "Basic",
            route: "+/grid/basic",
            content: () => import("./general/grids/basic")
         },
         {
            name: "Multiple Selection",
            route: "+/grid/basic",
            content: () => import("./general/grids/multi-select")
         },
         {
            name: "Grouping",
            route: "+/grid/grouping",
            content: () => import("./general/grids/grouping")
         },
         {
            name: "Dynamic Grouping",
            route: "+/grid/dynamic-grouping",
            content: () => import("./general/grids/dynamic-grouping")
         },
         {
            name: "Row Drag & Drop",
            route: "+/grid/drag-drop",
            content: () => import("./general/grids/drag-drop")
         },
         {
            name: "Filtering",
            route: "+/grid/filtering",
            content: () => import("./general/grids/filtering")
         },
         {
            name: "Row Editing",
            route: "+/grid/row-editing",
            content: () => import("./general/grids/row-editing")
         },
         {
            name: "Cell Editing",
            route: "+/grid/cell-editing",
            content: () => import("./general/grids/cell-editing")
         },
         {
            name: "Form Editing",
            route: "+/grid/form-editing",
            content: () => import("./general/grids/form-editing")
         },
         {
            name: "Row Expanding",
            route: "+/grid/row-expanding",
            content: () => import("./general/grids/row-expanding")
         },
         {
            name: "Header Menu",
            route: "+/grid/header-menu",
            content: () => import("./general/grids/header-menu")
         },
         {
            name: "Tree Grid",
            route: "+/grid/tree-grid",
            content: () => import("./general/grids/tree-grid")
         },
         {
            name: "Complex Header",
            route: "+/grid/complex-header",
            content: () => import("./general/grids/complex-header")
         },
         {
            name: "Buffering",
            route: "+/grid/buffering",
            content: () => import("./general/grids/buffering")
         },
         {
            name: "Dashboard Grid",
            route: "+/grid/dashboard-grid",
            content: () => import("./general/grids/dashboard-grid")
         },
         {
            name: "Misc",
            route: "+/grid/misc",
            content: () => import("./general/grids/misc")
         }
      ]
   },
   {
      name: "Forms",
      items: [
         {
            route: "+/checkbox",
            name: "Checkbox",
            content: () => import("./forms/checkbox/states")
         },
         {
            route: "+/radio",
            name: "Radio",
            content: () => import("./forms/radio/states")
         },
         {
            route: "+/switch",
            name: "Switch",
            content: () => import("./forms/switch/states")
         },
         {
            route: "+/text-field",
            name: "TextField",
            content: () => import("./forms/text-field/states")
         },
         {
            route: "+/number-field",
            name: "NumberField",
            content: () => import("./forms/number-field/states")
         },
         {
            route: "+/date-field",
            name: "DateField",
            content: () => import("./forms/date-field/states")
         },
         {
            route: "+/calendar",
            name: "Calendar",
            content: () => import("./forms/calendar/states")
         },
         {
            route: "+/month-picker",
            name: "MonthPicker",
            content: () => import("./forms/month-picker/states")
         },
         {
            route: "+/month-field",
            name: "MonthField",
            content: () => import("./forms/month-field/states")
         },
         {
            route: "+/text-area",
            name: "TextArea",
            content: () => import("./forms/text-area/states")
         },
         {
            route: "+/select",
            name: "Select",
            content: () => import("./forms/select/states")
         },
         {
            route: "+/lookup-field",
            name: "LookupField",
            content: () => import("./forms/lookup-field/states")
         },
         {
            route: "+/color-field",
            name: "ColorField",
            content: () => import("./forms/color-field/states")
         },
         {
            route: "+/color-picker",
            name: "ColorPicker",
            content: () => import("./forms/color-picker/states")
         },
         {
            route: "+/slider",
            name: "Slider",
            content: () => import("./forms/slider/states")
         },
         {
            route: "+/date-time-field",
            name: "DateTimeField",
            content: () => import("./forms/date-time-field/states")
         }
      ]
   },
   {
      name: "Charts",
      items: [
         {
            route: "+/pie-chart",
            name: "PieChart",
            content: () => import("./charts/pie-chart")
         },
         {
            route: "+/line-graph",
            name: "LineGraph",
            content: () => import("./charts/line-graph")
         },
         {
            route: "+/column-graph",
            name: "ColumnGraph",
            content: () => import("./charts/column-graph")
         },
         {
            route: "+/bar-graph",
            name: "BarGraph",
            content: () => import("./charts/bar-graph")
         },
         {
            route: "+/scatter-graph",
            name: "ScatterGraph",
            content: () => import("./charts/scatter-graph")
         },
         {
            route: "+/range",
            name: "Range",
            content: () => import("./charts/range")
         },
         {
            route: "+/column/",
            name: "Column",
            content: () => import("./charts/column")
         },
         {
            route: "+/bar/",
            name: "Bar",
            content: () => import("./charts/bar")
         },
         {
            route: "+/marker-line",
            name: "MarkerLine",
            content: () => import("./charts/marker-line")
         },
         {
            route: "+/marker/",
            name: "Marker",
            content: () => import("./charts/marker")
         }
      ]
   },
   {
      name: "Layout",
      items: [
         {
            route: "+/flex-row",
            name: "FlexRow",
            content: () => import("./general/flex-row")
         },
         {
            route: "+/flex-col",
            name: "FlexCol",
            content: () => import("./general/flex-col")
         }
      ]
   }
];

export let sorted = list.map(section => {
   if (section.items) {
      section.items = [...section.items].sort((a, b) => {
         if (a.name >= b.name) return 1;
         else return -1;
      });
   }

   return section;
});

export default list;
