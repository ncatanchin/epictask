
const srcs = require('../../tools/project-srcs')()

//noinspection JSUnusedLocalSymbols
/**
 * Gulp watch task, compiles on file change
 *
 * @param done
 */
function compileWatch(done) {
	log.info('GitOp Compilation Watching Files...')

	const watcher = gulp.watch(srcs, ['compile'])
	watcher.on('change', (event) => {
		log.info("Project Files Changed: ", event.path)
	})
	watcher.on('error', (event) => {
		log.error(`Received watcher error`,event)
	})

}

gulp.task('compile-watch',['compile'],compileWatch)