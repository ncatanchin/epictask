const path = require('path')
const gutil = require('gulp-util')
/**
 * Run all compile tasks sequentially
 */
function packageApp() {
	gutil.log('Starting packager')

	const electronPacker = require("gulp-electron-packer")
	const packageJson = require(path.resolve(baseDir, 'package.json'))
	return gulp
		.src(
			'.'
		)
		.pipe(electronPacker(packageJson))
		.pipe(gulp.dest(path.resolve(baseDir,'target')))

}

module.exports = gulp.task('package',['compile'],packageApp)
