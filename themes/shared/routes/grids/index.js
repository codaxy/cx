import {HtmlElement} from 'cx/ui/HtmlElement';
import {Section} from 'cx/ui/Section';
import {FlexRow} from 'cx/ui/layout/FlexBox';

import Dashboard from './Dashboard';
import Pagination from './Pagination';
import FixedHeader from './FixedHeader';
import Grouping from './Grouping';

import {casual} from 'shared/data/casual';
import {Format} from 'cx/util/Format';
import plural from 'plural';

Format.registerFactory('plural', (format, text) => {
   return value => plural(text, value);
});

export default <cx>
   <div>
      <span putInto="breadcrumbs">Grids</span>

      <FlexRow pad spacing wrap target="desktop">
         <Section title="Pagination" style="flex:1" mod="well">
            <Pagination />
         </Section>

         <Section title="Fixed Header" style="flex:1" mod="well">
            <FixedHeader />
         </Section>

         <Section title="Grouping" style="flex:1" mod="well">
            <Grouping />
         </Section>

         <Section title="Grid Dashboard" style="flex:2" mod="well" >
            <Dashboard />
         </Section>
      </FlexRow>
   </div>
</cx>;

