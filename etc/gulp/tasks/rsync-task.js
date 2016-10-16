require('shelljs/global')

const
	gulp = require('gulp'),
	path = require('path'),
	//rsync = require('gulp-rsync'),
	srcs = ['src/**/*.*','etc/**/*.*','tsconfig.json','package.json','build/**/*.*']


function syncFile(win32,file,event) {
	let
		destDir = ''
	
	if (event) {
		file = path.relative(process.cwd(),event.path)
		destDir = path.relative(process.cwd(),path.dirname(event.path))
	}
	
	if (win32) {
		echo(`Syncing ${file} to ${destDir} on windows`)
		exec(`scp -r ${file} "jglanz@10.0.1.49:c:/users/jglanz/Development/densebrain/epictask-workspace/epictask/${destDir}"`)
	} else {
		exec(`rsync -avz -e "ssh -p 22" ${file} "jglanz@10.0.1.46:/home/jglanz/Development/densebrain/epictask-workspace/epictask/${destDir}"`)
	}
}

function firstSync(win32) {
	for (let srcFile of ['src','etc','package.json','tsconfig.json','build']) {
		syncFile(win32,srcFile)
	}
}

/**
 * Clean task
 */
function linuxSync() {
	console.log(`Syncing`)
	firstSync(false)
}

function linuxSyncWatch(done) {
	const watcher = gulp.watch(srcs)
	watcher.on('change',(event) => syncFile(false,null,event))
}

gulp.task('linux-sync', [], linuxSync)
gulp.task('linux-sync-watch', ['linux-sync'], linuxSyncWatch)

/**
 * Clean task
 */
function winSync() {
	console.log(`Syncing`)
	firstSync(true)
}

function winSyncWatch(done) {
	const watcher = gulp.watch(srcs)
	watcher.on('change',(event) => syncFile(true,null,event))
}


gulp.task('win-sync', [], winSync)
gulp.task('win-sync-watch', ['win-sync'], winSyncWatch)


function allSyncWatch(done) {
	const watcher = gulp.watch(srcs)
	watcher.on('change',(event) => {
		syncFile(false,null,event)
		syncFile(true,null,event)
	})
}

gulp.task('all-sync', ['win-sync','linux-sync'], () => {})
gulp.task('all-sync-watch', ['all-sync'], allSyncWatch)