

/**
 * Clean task
 */
function clean() {
	return del([
		'target',
		'dist'
	])
}


gulp.task('clean', [], clean)
