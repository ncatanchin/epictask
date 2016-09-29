

/**
 * Clean task
 */
function clean() {
	return del([
		'target',
		'dist/**/*',
		'.awcache*',
		'.happy*',
		'.sass*',
		'build'
	])
}


gulp.task('clean', [], clean)
