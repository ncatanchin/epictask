require('shelljs/global')

const
	gulp = require('gulp'),
	path = require('path'),
	//rsync = require('gulp-rsync'),
	srcs = ['src/**/*.*','etc/**/*.*','tsconfig.json','package.json','build/**/*.*']



/**
 * Clean task
 */
function linuxSync() {
	console.log(`Syncing`)
	exec(`rsync -avz -e "ssh -p 22" src "jglanz@10.0.1.46:/home/jglanz/Development/densebrain/epictask-workspace/epictask/"`)
	exec(`rsync -avz -e "ssh -p 22" package.json "jglanz@10.0.1.46:/home/jglanz/Development/densebrain/epictask-workspace/epictask/"`)
	exec(`rsync -avz -e "ssh -p 22" tsconfig.json "jglanz@10.0.1.46:/home/jglanz/Development/densebrain/epictask-workspace/epictask/"`)
	exec(`rsync -avz -e "ssh -p 22" etc "jglanz@10.0.1.46:/home/jglanz/Development/densebrain/epictask-workspace/epictask/"`)
	//exec(`rsync -avz -e "ssh -p 22" typings "jglanz@10.0.1.46:/home/jglanz/Development/densebrain/epictask-workspace/epictask/"`)
	exec(`rsync -avz -e "ssh -p 22" build "jglanz@10.0.1.46:/home/jglanz/Development/densebrain/epictask-workspace/epictask/"`)
}

function linuxSyncWatch(done) {
	const watcher = gulp.watch(srcs)
	watcher.on('change',(event) => {
		const
			file = path.relative(process.cwd(),event.path),
			destDir = path.relative(process.cwd(),path.dirname(event.path))
		
		console.log(`Updating ${file} to ${destDir}`)
		exec(`rsync -avz -e "ssh -p 22" ${file} "jglanz@10.0.1.46:/home/jglanz/Development/densebrain/epictask-workspace/epictask/${destDir}"`)
	})
}


gulp.task('linux-sync', [], linuxSync)
gulp.task('linux-sync-watch', ['linux-sync'], linuxSyncWatch)



/**
 * Clean task
 */
function winSync() {
	console.log(`Syncing`)
	exec(`scp -r src "jglanz@10.0.1.49:c:/users/jglanz/Development/densebrain/epictask-workspace/epictask/"`)
	exec(`scp -r package.json "jglanz@10.0.1.49:c:/users/jglanz/Development/densebrain/epictask-workspace/epictask/"`)
	exec(`scp -r tsconfig.json "jglanz@10.0.1.49:c:/users/jglanz/Development/densebrain/epictask-workspace/epictask/"`)
	exec(`scp -r etc "jglanz@10.0.1.49:c:/users/jglanz/Development/densebrain/epictask-workspace/epictask/"`)
	exec(`scp -r build "jglanz@10.0.1.49:c:/users/jglanz/Development/densebrain/epictask-workspace/epictask/"`)
}

function winSyncWatch(done) {
	const watcher = gulp.watch(srcs)
	watcher.on('change',(event) => {
		const
			file = path.relative(process.cwd(),event.path),
			destDir = path.relative(process.cwd(),path.dirname(event.path))
		
		console.log(`Updating ${file} to ${destDir}`)
		exec(`scp -r ${file} "jglanz@10.0.1.49:c:/users/jglanz/Development/densebrain/epictask-workspace/epictask/${destDir}"`)
	})
}


gulp.task('win-sync', [], winSync)
gulp.task('win-sync-watch', ['win-sync'], winSyncWatch)


function allSyncWatch(done) {
	const watcher = gulp.watch(srcs)
	watcher.on('change',(event) => {
		const
			file = path.relative(process.cwd(),event.path),
			destDir = path.relative(process.cwd(),path.dirname(event.path))
		
		console.log(`Updating ${file} to ${destDir}`)
		exec(`rsync -avz -e "ssh -p 22" ${file} "jglanz@10.0.1.46:/home/jglanz/Development/densebrain/epictask-workspace/epictask/${destDir}"`)
		exec(`scp -r ${file} "jglanz@10.0.1.49:c:/users/jglanz/Development/densebrain/epictask-workspace/epictask/${destDir}"`)
	})
}

gulp.task('all-sync', ['win-sync','linux-sync'], () => {})
gulp.task('all-sync-watch', ['all-sync'], allSyncWatch)