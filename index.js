'use strict'

const sass = require('gulp-sass')
const path = require('path')
const nodemon = require('gulp-nodemon')
const rev = require('gulp-rev')
const revReplace = require('gulp-rev-replace')
const filter = require('gulp-filter')
const sourcemaps = require('gulp-sourcemaps')
const rimraf = require('rimraf')
const livereload = require('gulp-livereload')
const autoprefixer = require('autoprefixer')
const postcss = require('gulp-postcss')
const createWebpackCompiler = require('./createWebpackCompiler')

module.exports = function(gulp, userConfig) {

  // ==== CONFIGURATION ===
  const config = userConfig || {}

  // PATHS CONFIGURATION
  // Base directory (Set as empty string unless everything is in a subdirectory.)
  const BASE_PATH = config.basePath || ''
  // Location of source files
  const SRC_PATH = config.srcPath || `${BASE_PATH}src/`
  // Intermediate build directory (for pre-revisioning output)
  const TMP_PATH = config.tmpPath || `${BASE_PATH}tmp_build/`
  // Location of JavaScript files
  const JS_SRC_GLOB = config.jsSrcGlob || `${SRC_PATH}js/**/*.js`
  const JS_SRC_PATH = config.jsSrcPath || `${SRC_PATH}js`
  const SERVER_DEST = config.serverDest || TMP_PATH
  const SERVER_FILE = config.serverFile || 'server.js'
  const CLIENT_DEST = config.clientDest || `${TMP_PATH}public/js`
  const CLIENT_FILE = config.clientFile || 'client.js'
  // SASS source and destination
  const SASS_GLOB = config.sassGlob || `${SRC_PATH}css/**/*.scss`
  const SASS_DEST = config.sassDest || `${TMP_PATH}public/css`
  // Non-JavaScript, non-CSS assets source and destination
  const STATICS_GLOB = config.staticsGlob || `${SRC_PATH}**/*.!(js|css)`
  const STATICS_DEST = config.staticsDest || `${TMP_PATH}public`
  // Final build step (revisioning) source and destination
  const DIST_GLOB = config.distGlob || `${TMP_PATH}**/*`
  const DIST_DEST = config.distDest || `${BASE_PATH}dist`
  // Location to watch for changes (final build step destination)
  const NODEMON_GLOB = config.nodemonGlob || `${DIST_DEST}/**/*`
  const NODEMON_SCRIPT = config.nodemonScript || `${DIST_DEST}/${SERVER_FILE}`

  // Amount of time to wait between nodemon restarts and livereload triggers
  const LIVERELOAD_TIMEOUT = config.livereloadTimeout || 2000

  // CDN CONFIGURATION (Set as empty string to serve normally.)
  const ASSET_URL_PREFIX = config.assetUrlPrefix || ''

  // SASS CONFIGURATION
  const SASS_INCLUDE_PATHS = config.sassIncludePaths || []
  const SASS_OPTIONS = {
    includePaths: SASS_INCLUDE_PATHS,
  }
  if(process.env.NODE_ENV === 'production') {
    SASS_OPTIONS.outputStyle = 'compressed'
  }
  const AUTOPREFIXER_OPTIONS = config.autoprefixer || {}

  // WEBPACK CONFIGURATION
  const WEBPACK_OPTIONS = {
    src: JS_SRC_PATH,
    client: {dest: CLIENT_DEST, file: CLIENT_FILE},
    server: {dest: SERVER_DEST, file: SERVER_FILE}
  }
  const WEBPACK_WATCH_CONFIG = {
    aggregateTimeout: 300
  }
  const WEBPACK_HANDLER = function(err, stats) {
    if(err) {
      console.error(err.error)
      console.error('ERROR: Webpack build failed.')
    } else {
      console.log('SUCCESS: Webpack build completed.')
    }
  }

  // ==== TASKS DEFINITIONS ===

  // WEBPACK TASKS
  const webpack = createWebpackCompiler(WEBPACK_OPTIONS)
  let webpackWatch
  gulp.task('webpack', function(done) {
    webpack.run(function(err, stats) {
      WEBPACK_HANDLER(err, stats)
      done()
    })
  })

  gulp.task('webpack:start-watch', function() {
    if (!webpackWatch) {
      return
    }

    for (let i = 0, len = webpackWatch.watchings.length; i < len; i++) {
      // reset webpack.watch state when it contains errors
      if (webpackWatch.watchings[i].error !== null) {
        // purge error message and input file cache to start a fresh build
        webpackWatch.watchings[i].error = null
        webpackWatch.watchings[i].compiler.purgeInputFileSystem()
        // invaldiate and re-run build
        webpackWatch.watchings[i].invalidate()
      }
    }
  })

  gulp.task('webpack:watch', ['webpack'], function() {
    webpackWatch = webpack.watch(WEBPACK_WATCH_CONFIG, WEBPACK_HANDLER)
    gulp.watch(JS_SRC_GLOB, ['webpack:start-watch'])
  })

  // SASS TASKS
  gulp.task('sass', function() {
    return gulp.src(SASS_GLOB)
      .pipe(sourcemaps.init())
      .pipe(sass(SASS_OPTIONS).on('error', sass.logError))
      .pipe(postcss([autoprefixer(AUTOPREFIXER_OPTIONS)]))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(SASS_DEST))
  })
  gulp.task('sass:watch', function() {
    gulp.watch(SASS_GLOB, ['sass'])
  })

  // NON-JAVASCRIPT, NON-CSS ASSETS TASKS
  gulp.task('statics', function() {
    gulp.src(STATICS_GLOB).pipe(gulp.dest(STATICS_DEST))
  })
  gulp.task('statics:watch', function() {
    gulp.watch(STATICS_GLOB, ['statics'])
  })

  // FINAL BUILD (REVISIONING) HELPER FUNCTION AND TASKS
  function modifyPublishPath(filename) {
    const publicMatches = filename.match(/^public(\/.*)/)
    // Remove /public prefix when replacing references.
    if(publicMatches && publicMatches.length > 1) {
      filename = publicMatches[1]
    }
    const mapMatches = filename.match(/\.map$/)
    // Stick to relative paths for sourcemaps.
    if(mapMatches) {
      const mapParts = filename.split('/')
      filename = mapParts[mapParts.length - 1]
    }
    return filename
  }

  function dist() {
    const publicFilter = filter('**/public/**/*', {restore: true})
    const revReplaceFilter = filter(['**/*.js', '**/*.css', '**/*.scss'], {restore: true})
    return gulp.src(DIST_GLOB)
      .pipe(publicFilter)
      .pipe(rev())
      .pipe(publicFilter.restore)
      .pipe(revReplace({
        modifyUnreved: modifyPublishPath,
        modifyReved: (filename) => `${ASSET_URL_PREFIX}${modifyPublishPath(filename)}`,
      }))
      .pipe(gulp.dest(DIST_DEST))
  }
  gulp.task('dist', dist)
  gulp.task('dist:watch', function() {
    gulp.watch(DIST_GLOB, ['dist'])
  })

  // POST-BUILD CLEANUP TASKS
  gulp.task('clean:tmp', function(done) {
    return rimraf(TMP_PATH, done)
  })
  gulp.task('clean:dist', function(done) {
    return rimraf(DIST_DEST, done)
  })
  gulp.task('clean', ['clean:tmp', 'clean:dist'])

  // SERVER RUNNER TASKS
  let reloadTimeout = null
  function setReloadTimeout() {
    clearTimeout(reloadTimeout)
    reloadTimeout = setTimeout(livereload.reload, LIVERELOAD_TIMEOUT)
  }
  gulp.task('serve:watch', function() {
    livereload.listen()
    nodemon({
      script: NODEMON_SCRIPT,
      watch: NODEMON_GLOB,
    }).on('restart', setReloadTimeout)
  })

  // BUILD AND WATCH CHAINS
  gulp.task('build', ['webpack', 'sass', 'statics'], function() {
    dist()
  })
  gulp.task('dev', ['serve:watch', 'webpack:watch', 'sass:watch', 'statics:watch', 'dist:watch'])
}
