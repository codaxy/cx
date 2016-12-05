var modifyBabelPreset = require('modify-babel-preset');

module.exports = options => {

   options = options || {};
   var pragma = options.pragma || "VDOM.createElement";

   return modifyBabelPreset(
      ['env', options],
      {
         'transform-cx-imports': options.cx && options.cx.useSrc && {
            sass: options.cx.sass
         },
         'transform-object-rest-spread': true,
         "transform-function-bind": true,
         'cx': true,
         "transform-react-jsx": {"pragma": pragma}
      }
   );
};
