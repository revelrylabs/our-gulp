const gulp = require('gulp')
const createGulpTasks = require('./')

createGulpTasks(gulp, {
  basePath: __dirname + '/test/',
  sassIncludePaths: [
    'node_modules/foundation-sites/scss',
  ]
})
