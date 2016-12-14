const gulp = require('gulp')
const createGulpTasks = require('./')

createGulpTasks(gulp, {
  basePath: __dirname + '/test/',
  nodePath: __dirname + '/test/src/js',
  sassIncludePaths: [
    'node_modules/foundation-sites/scss',
  ]
})
