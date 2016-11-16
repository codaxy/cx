import {HtmlElement} from 'cx/ui/HtmlElement';
import {Route} from 'cx/ui/nav/Route';
import {PureContainer} from 'cx/ui/PureContainer';


import createLayout from 'shared/layout';

import Default from './default';
import Forms from 'shared/routes/forms';
import Grids from 'shared/routes/grids';
import Charts from 'shared/routes/charts';
import Blocks from 'shared/routes/blocks';
import Reset from 'shared/routes/reset';

const layout = createLayout(<cx>
   <a href="/themes">Themes</a>
   <a href="#">Dark</a>
</cx>);

export default <cx>
   <PureContainer outerLayout={layout}>
      <Route route="#" url:bind="hash">
         <Default />
      </Route>
      <Route route="#reset" url:bind="hash">
         <Reset />
      </Route>
      <Route route="#forms" url:bind="hash">
         <Forms />
      </Route>
      <Route route="#grids" url:bind="hash">
         <Grids />
      </Route>

      <Route route="#charts" url:bind="hash">
         <Charts />
      </Route>

      <Route route="#blocks" url:bind="hash">
         <Blocks />
      </Route>
   </PureContainer>
</cx>


