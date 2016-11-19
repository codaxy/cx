import {HtmlElement} from 'cx/ui/HtmlElement';
import {Menu} from 'cx/ui/nav/Menu';
import {Section} from 'shared/components/Section';
import {FlexRow} from 'shared/components/FlexBox';

export default <cx>
   <FlexRow distance wrap>
      <Section mod="well" title="Neutral Theme">
         <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
         <ul>
            <li>
               <a href="#reset">Reset</a>
            </li>
            <li>
               <a href="#blocks">Blocks</a>
            </li>
            <li>
               <a href="#forms">Forms</a>
            </li>
            <li>
               <a href="#grids">Grids</a>
            </li>
            <li>
               <a href="#charts">Charts</a>
            </li>
            <li>
               <a href="#overlays">Overlays</a>
            </li>
         </ul>
      </Section>
   </FlexRow>
</cx>
