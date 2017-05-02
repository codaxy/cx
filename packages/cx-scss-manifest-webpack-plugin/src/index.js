let cxManifest = require('cx/manifest.js'),
   fs = require('fs');

let cxModuleNameMap = {};

for (let name in cxManifest) {
   if (cxManifest[name].scss)
      cxModuleNameMap[cxManifest[name].js] = name;
}

function CxScssManifestPlugin(options) {
   this.opts = Object.assign({}, options);
   this.manifest = {};
}

CxScssManifestPlugin.prototype.apply = function(compiler) {
   let manifest = this.manifest;
   let dirty = false;
   let count = 0;

   compiler.plugin('after-emit', (compilation, callback) => {
      compilation.chunks.forEach(chunk => {
         chunk.modules.forEach(module => {

            if (!module.resource || module.resource.indexOf('cx\\src') != -1 || module.resource.indexOf('node_modules') != -1)
               return;

            module.dependencies.forEach(dep => {
                if (!dep.module || !dep.module.rawRequest || dep.module.rawRequest.indexOf('cx/') != 0)
                  return;

               // if (++count <= 1) {
               //    //console.log(module.resource, dep.module.rawRequest, dep.module.resource, dep.importedVar, dep.request, dep.userRequest);//, Object.keys(dep))
               //    console.log(dep.module.rawRequest, dep.module.usedExports);
               // }

               dep.module.usedExports.forEach(exp => {
                  let cxModule = dep.module.rawRequest.substring(3) + '/' + exp;
                  //console.log(cxModule);
                  if (!manifest[cxModule] && cxManifest[cxModule] && cxManifest[cxModule].scss) {
                     //console.log(cxModule);
                     dirty = true;
                     manifest[cxModule] = true;
                  }
               });
            });

            // if (!module.resource)
            //    return;
            // let index = module.resource.indexOf('cx\\src\\');
            // if (index == -1)
            //    return;
            //
            // let path = module.resource.substring(index + 3).replace(/\\/g, '/');
            // let cxModule = cxModuleNameMap[path];
            // if (cxModule && !manifest[cxModule]) {
            //    //console.log(cxModule);
            //    dirty = true;
            //    manifest[cxModule] = true;
            // }
         })
      });

      let content = "//THIS FILE IS AUTO-GENERATED USING cx-scss-manifest-webpack-plugin\n\n";
      content += "$cx-include-all: false;\n\n";

      content += "@include cx-widgets(\n";
      content += Object.keys(manifest).map(k=>'\t"cx/' + k + '"').join(',\n');
      content += "\n);\n";

      // content += "$cx-only: map-merge($cx-only, (\n";
      // content += Object.keys(manifest).map(k=>'\t"' + k + '": true').join(',\n');
      // content += "\n));\n";

      if (dirty) {
         fs.writeFileSync(this.opts.output, content);
         dirty = false;
      }

      callback();
   });

   // compiler.plugin("compilation", (compilation) => {
   //    compilation.plugin("seal", function () {
   //       console.log(compilation.modules.filter(m => m.resource && m.resource.indexOf('manifest') != -1));
   //       console.log(compilation.modules.map(m => [m.resource, m.assets]));
   //    });
   // });
};

module.exports = CxScssManifestPlugin;