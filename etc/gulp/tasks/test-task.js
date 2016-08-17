
const electronMocha = require('gulp-electron-mocha')

/**
 * Create a test task
 *
 * @param tests
 * @returns {function()}
 */
function makeMochaTask(tests = null) {
	return () => {
		require('../../mocha/mocha-setup')
		if (!tests) {
			tests = ['dist/*TestEntry.js']
		}

		const reporter = (process.env.CIRCLE) ?
			'mocha-junit-reporter' :
			'spec'

		return gulp.src(tests)
			.pipe(mocha({reporter}))
	}
}

/**
 * Create 'test-all'
 */
gulp.task('test-main',[],makeMochaTask())

/**
 * Export task creator for individual test tasks
 *
 * @type {makeMochaTask}
 */
module.exports = makeMochaTask