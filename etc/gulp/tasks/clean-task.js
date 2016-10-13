

/**
 * Clean task
 */
function clean() {
	return del([
		'target',
		'dist/**/*',
		'.awcache/*',
		'.happy*',
		'.sass*'
	])
}


gulp.task('clean', [], clean)
