const del = require('del')

del(['.awcache/**/*.*','dist'])

// Load the global common runtime for build/test/tools
require('./etc/tools/global-env')


const
	gulp = require('gulp'),
	runSequence = require('run-sequence'),
	git = require('gulp-git'),
	ghRelease = require('gulp-github-release'),
	ts = require('gulp-typescript'),
	tsc = require('typescript'),
	babel = require('gulp-babel'),
	tsdoc = require('gulp-typedoc')



Object.assign(global,{
	ts,
	tsc,
	babel,
	tsdoc,
	gulp,
	runSequence,
	del,
	git,
	ghRelease
})

/**
 * Load auxillary tasks
 */

require('./etc/gulp/tasks')







