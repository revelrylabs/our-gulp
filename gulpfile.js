const createGulpTasks = require('./')

createGulpTasks({
  basePath: __dirname + '/test/',
  nodePath: __dirname + '/test/src/js',
  sassIncludePaths: [
    'node_modules/foundation-sites/scss',
  ]
})
