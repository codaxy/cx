#! /usr/bin/env node

function execute(argv) {

   var program = require('commander'),
      pkg = require('./package.json'),
      path = require('path'),
      fs = require('fs'),
      spawn = require('cross-spawn'),
      copydir = require('copy-dir'),
      chalk = require('chalk');


   program
      .version(pkg.version)
      .option('-i, install', 'Install necessary packages')
      .option('scaffold', 'Scaffold application structure')
      .option('-s, start', 'Start the development server')
      .option('-b, build', 'Make a new production build')
      .option('create', 'Create a new project directory with the basic app structure')
      .option('--yarn', 'Use yarn instead of npm')
      .option('add, route', 'Add new route folder')
      .parse(argv);

   if (program.version) {
      console.log('Cx CLI - ' + pkg.version);
   }

   var appPath = process.cwd(),
      appPackagePath = path.join(appPath, 'package.json'),
      tplPath = path.join(__dirname, './tpl/'),
      tplPackagePath = path.join(tplPath, 'package.json');

   if (program.create) {
      var projectName = program.args[0];
      var useYarn = !!program.yarn;

      if (!projectName) {
         console.error('Please specify the project directory:');
         console.log(
            `  ${chalk.cyan(useYarn ? 'yarn create cx-app' : 'create-cx-app')} ${chalk.green('<project-directory>')}`
         );
         console.log();
         return;
      }

      var root = path.resolve(projectName);

      // check if project directory already exists
      if (fs.existsSync(root)) {
         console.error("Folder '" + chalk.green(root) + "' already exists. Aborting to prevent overwrites...");
         console.log();
         return;
      }

      fs.mkdirSync(projectName);
      process.chdir(root);

      // init package.json
      spawn.sync('npm', ['init', '-y'], {stdio: 'inherit'});

      // invoke cx scaffold
      var scaffoldArgs = [argv[0], argv[1], 'scaffold', projectName];
      if (useYarn) scaffoldArgs.push('--yarn');
      execute(scaffoldArgs);
      return;
   }

   if (!fs.existsSync(appPackagePath)) {
      console.warn('package.json could not be found in the current directory.');
      return -1;
   }

   if (program.scaffold) {

      var files = fs.readdirSync(appPath);
      var test = ["index.js", "index.html", "index.scss"];
      for (var i = 0; i < test.length; i++) {
         if (files.indexOf(test[i]) != -1) {
            console.error('App files detected. Aborting to prevent overwrites...');
            return -1;
         }
      }

      var err = copydir.sync(tplPath, appPath, function (stat, filepath, filename) {
         //skip package.json and _template folder
         if (filepath.indexOf('_template') != -1 || filename == 'package.json')
            return false;
         return true;
      });

      if (err) {
         console.error('Copy error.', err);
      }
   }

   if (program.install || program.scaffold) {
      console.log('Installing necessary packages using ' + (program.yarn ? 'yarn' : 'npm') + '.');

      var appPkg = require(appPackagePath);
      var tplPkg = require(tplPackagePath);

      if (tplPkg.scripts) {
         if (!appPkg.scripts)
            appPkg.scripts = {};

         for (var name in tplPkg.scripts) {
            if (appPkg.scripts[name]) {
               console.warn('Script ' + name + ' skipped as it is already in package.json.');
            } else {
               appPkg.scripts[name] = tplPkg.scripts[name];
            }
         }
      }

      if (tplPkg.dependencies) {
         if (!appPkg.dependencies)
            appPkg.dependencies = {};

         for (var name in tplPkg.dependencies) {
            if (appPkg.dependencies[name]) {
               console.warn('Dependency ' + name + ' skipped as it is already in package.json.');
            } else {
               appPkg.dependencies[name] = tplPkg.dependencies[name];
            }
         }
      }

      if (tplPkg.devDependencies) {
         if (!appPkg.devDependencies)
            appPkg.devDependencies = {};

         for (var name in tplPkg.devDependencies) {
            if (appPkg.devDependencies[name]) {
               console.warn('Dev-dependency ' + name + ' skipped as it is already in package.json.');
            } else {
               appPkg.devDependencies[name] = tplPkg.devDependencies[name];
            }
         }
      }

      fs.writeFileSync(appPackagePath, JSON.stringify(appPkg, null, 2));

      console.log('Scripts and dependencies added to package.json! Installing...');

      if (program.yarn) {
         return spawn.sync('yarn', [], {stdio: 'inherit'});
      } else {
         return spawn.sync('npm', ['install'], {stdio: 'inherit'});
      }
   }

   if (program.start || program.open) {
      console.log('npm start');
      return spawn.sync('npm', ['start'], {stdio: 'inherit'});
   }

   if (program.build) {
      console.log('npm run build');
      return spawn.sync('npm', ['run', 'build'], {stdio: 'inherit'});
   }

   if (program.route) {
      var newRoute = program.args[0].split('/');
      console.log();
      if (!newRoute) {
         console.log("Syntax error: missing route name. Correct syntax: cx add route route_name");
         return;
      }
      var tplDir = path.join(tplPath, './app/routes/_template');

      // initial route parent folder
      var parentDir = path.join(appPath, './app/routes/');

      // loop through newRoute sub dirs array
      // for each sub, check if it exists and create it if it doesn't
      newRoute.reduce(function (parentDir, route, i) {
         var newRouteDir = path.join(parentDir, route);
         // if last element in the route array, copy template files
         // otherwise just check if the sub folder exists and create it
         if (i === newRoute.length - 1) {
            if (!fs.existsSync(newRouteDir)) {
               fs.mkdirSync(newRouteDir);
               var err = copydir.sync(tplDir, newRouteDir);
               if (err) {
                  console.error('Copy error.', err);
               } else {
                  console.log("New route folder 'app/routes/" + newRoute.join('/') + "' created.");
               }
            } else {
               console.error("Folder 'app/routes/" + newRoute.join('/') + "' already exists.");
            }
         } else {
            if (!fs.existsSync(newRouteDir))
               fs.mkdirSync(newRouteDir);
         }
         return newRouteDir;
      }, parentDir);

      return;
   }
}

module.exports = execute;