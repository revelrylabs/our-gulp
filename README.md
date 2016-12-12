# our-build-pipeline

Tool for creating a Gulpfile that produces both server and client bundles.
Does the following:

* Uses a `webpack` multi-compiler for both client and server JavaScript
* Uses `babel-loader`, configured via `.babelrc` for next-gen JavaScript
* Compiles Sass with `gulp-sass`
* Copies any other static assets in the source dir to target directory
* Uses `gulp-rev` and `gulp-rev-replace` to cache-bust files

## Basic usage

To use mainly default configuration, your directory should look like the following:

```
/project-root
  gulpfile.js
  /src
    /js
    /css
    /img
    /something-else
```

In your `gulpfile.js`:

```javascript
require('our-build-pipeline')({
  basePath: __dirname + '/',
  sassIncludePaths: ['node_modules/foundation-sites/scss'],
})
```

Run `gulp build` to build once, and run `gulp dev` keep the server running and watch for changes.

## Build directories and keeping git clean

The build process will create an intermediate build directory (before asset revisioning)
and a final build directory. By default these directories are `tmp_build` and `dist`.
You probably want to add them to `.gitignore`.

## Advanced usage

For now, read the code.
