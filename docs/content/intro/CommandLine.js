import {Md} from '../../components/Md';
import {CodeSplit} from '../../components/CodeSplit';
import {Content} from 'cx/ui/layout/Content';
import {CodeSnippet} from '../../components/CodeSnippet';

import {HtmlElement} from 'cx/ui/HtmlElement';
import {Tab} from 'cx/ui/nav/Tab';

export const CommandLine = <cx>
    <Md>
        # Command Line Interface

        <CodeSplit>
        
        Cx requires tools such as babel and webpack which are plugin-based and require a 
        significant amount of work to configure properly.
        Normally, when starting a new project, you wouldn't go through all of that setup 
        every single time, but rather use some kind of boilerplate project that contains the 
        basic file structure as well as all required tools and configuration code. 
        
        We created one such project and put it inside the 
        [Cx Command Line Tool](https://www.npmjs.com/package/cx-cli). This
        tool helps you start and evolve your application — it is the quickest way for setting 
        things up.

        ## Usage

        Provided that you have Node.js and npm installed, you can use your favorite command line
        tool to quickly set up a new Cx project. 

        If you haven't done so already, inside the project folder initialize the package.json
        file by running the command `npm init`.

        Install the cx-cli tool:

        `npm install cx-cli --global`
        
        For new projects, use scaffold to create basic app structure.

        `cx scaffold [--yarn]`

        Append --yarn to use yarn package manager to install packages.

        Alternatively, use install to add packages into an existing project structure:

        `cx install [--yarn]`
        Please note that this will add Cx, React, Babel and Sass related packages.

        Start your application using:

        `cx start`
        
        Make a production build:

        `cx build`

        Set up a new route folder:

        `cx add route route_name`

        This command creates a new folder - `app/routes/route_name` and copies the `index.js` 
        and `index.scss` files from the template.

            <CodeSnippet putInto="code">{`
                // Create a new app

                md my-cx-app
                cd my-cx-app

                npm init -y
                npm install cx-cli --global

                cx scaffold
                cx start
                
                // Set up a new route folder
                cx add route route_name
            `}</CodeSnippet>
        </CodeSplit>

   </Md>
</cx>
