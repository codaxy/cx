import {Md} from '../../components/Md';
import {CodeSplit} from '../../components/CodeSplit';
import {CodeSnippet} from '../../components/CodeSnippet';
import {ConfigTable} from '../../components/ConfigTable';
import {ImportPath} from '../../components/ImportPath';

import {HtmlElement} from 'cx/ui/HtmlElement';
import {Content} from 'cx/ui/layout/Content';
import {Calendar} from 'cx/ui/form/Calendar';

import configs from './configs/Calendar';

export const Calendars = <cx>
   <Md>
      # Calendar
      Calendar is used for selecting dates.

      <ImportPath path={"import {Calendar} from 'cx/ui/form/Calendar';"} />

      <CodeSplit>

         <div class="widgets">
               <Calendar value:bind="$page.date" />
               <Calendar value:bind="$page.date"
                         minValue="2016-05-10"
                         maxValue="2016-05-20"
                         maxExclusive
                         refDate="2016-05-08" />
         </div>

         <Content name="code">
            <CodeSnippet>{`
                <div class="widgets">
                   <Calendar value:bind="$page.date" />
                   <Calendar value:bind="$page.date"
                         minValue="2016-05-10"
                         maxValue="2016-05-20"
                         maxExclusive
                         refDate="2016-05-08" />
                </div>
            `}</CodeSnippet>
         </Content>
      </CodeSplit>

      > Use `Enter` key to select a date. Use arrow keys, `Home`, `End`, `Page Up` and `Page Down` keys to navigate the calendar.

      ## Configuration

      <ConfigTable props={configs} />

   </Md>
</cx>
