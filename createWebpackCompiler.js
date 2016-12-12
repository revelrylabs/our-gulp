const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')

module.exports = function(options) {

  //
  // BASE CONFIGURATION
  //

  const DEBUG = process.env.NODE_ENV !== 'production'
  // Whether or not to bail on first encountered error.
  const BAIL = true
  // Which devtool to use for JS source maps.
  const DEVTOOL = 'source-map'

  //
  // LOADERS AND PLUGINS
  //

  // JavaScript Babel loader.
  // See .babelrc for Babel configuration.
  const jsLoader = {
    test: /\.js$/,
    loader: 'babel',
  }
  // Require 'source-map-support' at the top of every entry file. (Use with Node bundles only.)
  const sourceMapSupportBannerPlugin = new webpack.BannerPlugin("require('source-map-support').install()", {raw: true, entryOnly: true})

  // Make NODE_ENV switches work on client.
  const definePlugin = new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  })
  const clientPlugins = [definePlugin]
  // Minification.
  const uglifyPlugin = new webpack.optimize.UglifyJsPlugin()
  if(process.env.NODE_ENV === 'production') {
    clientPlugins.push(uglifyPlugin)
  }

  //
  // CLIENT
  //

  const clientConfig = {
    name: 'client',
    bail: BAIL,
    devtool: DEBUG ? DEVTOOL : null, // Don't set a devtool when debugging.
    output: {
      path: options.client.dest,
      filename: options.client.file,
    },
    entry: [
      path.join(options.src, options.client.file),
    ],
    module: {
      loaders: [
        jsLoader,
      ],
    },
    plugins: clientPlugins,
  }

  //
  // SERVER
  //

  const serverConfig = {
    name: 'server',
    bail: BAIL,
    devtool: DEVTOOL,
    output: {
      path: options.server.dest,
      filename: options.server.file,
      // Expose exports from the entry module via `module.exports`
      libraryTarget: 'commonjs2',
    },
    entry: [
      path.join(options.src, options.server.file),
    ],
    module: {
      loaders: [
        jsLoader,
      ],
    },
    // Make the output Node-compatible.
    target: 'node',
    // Don't bundle in the NPM dependencies.
    externals: nodeExternals(),
    plugins: [
      sourceMapSupportBannerPlugin,
    ],
  }

  //
  // CREATE A WEBPACK MULTI-COMPILER THAT WILL DO THEM ALL AT ONCE
  //

  return webpack([
    clientConfig,
    serverConfig,
  ])
}
