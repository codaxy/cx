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

let ns1 = /cx[\\\/]src[\\\/](\w*)[\\\/]/;
let ns2 = /cx[\\\/](\w*)[\\\/]/;

CxScssManifestPlugin.prototype.apply = function (compiler) {
   let manifest = this.manifest;
   let dirty = false;

   compiler.plugin('compilation', (compilation) => {
      compilation.plugin('additional-chunk-assets', (chunks) => {
         chunks.forEach(chunk => {
            chunk.forEachModule(module => {

               if (!module.resource || module.resource.indexOf('node_modules') !== -1)
                  return;

               module.dependencies.forEach(dep => {
                  if (!dep.module || !dep.module.usedExports || !dep.module.resource)
                     return;

                  let ns = dep.module.resource.match(ns1) || dep.module.resource.match(ns2);
                  if (!ns)
                     return;

                  dep.module.usedExports.forEach(exp => {
                     let cxModule = ns[1] + '/' + exp;
                     if (!manifest[cxModule] && cxManifest[cxModule]) {
                        dirty = true;
                        manifest[cxModule] = true;
                     }
                  });
               });
            })
         });

         let content = "//THIS FILE IS AUTO-GENERATED USING cx-scss-manifest-webpack-plugin\n\n";
         content += "$cx-include-all: false;\n\n";

         let keys = Object.keys(manifest);
         keys.sort();

         content += "@include cx-widgets(\n";
         content += keys.map(k => '\t"cx/' + k + '"').join(',\n');
         content += "\n);\n";

         if (dirty) {
            let previousContent = fs.readFileSync(this.opts.outputPath, "utf8");
            if (content != previousContent) {
               console.log('CxJS SCSS manifest update.')
               fs.writeFileSync(this.opts.outputPath, content);
            }
            dirty = false;
         }
      });
   });
};

module.exports = CxScssManifestPlugin;