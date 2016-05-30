

/**
 * Clean task
 */
function clean() {
	return del([
		'target',
		'dist',
		'.awcache'
	])
}


gulp.task('clean', [], clean)
