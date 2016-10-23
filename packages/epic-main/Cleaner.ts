import path = require('path')
import child_process = require('child_process')
import { Events } from "shared/config/Events"



for (let arg of process.argv) {
	if (arg === '--epic-clean') {
		try {
			console.log(`Cleaning app`)
			const
				{ app } = require('electron'),
				
				dataPath = path.resolve(app.getPath('userData')),
				
				cmds = require('shelljs')
			
			for (let file of [ 'epictask-*', 'store-state', 'settings.json', 'sync-status.json' ]) {
				const
					fullPath = `${dataPath}${path.sep}${file}`
				
				console.log(`Cleaning ${fullPath}`)
				
				cmds.rm('-Rf', fullPath)
				
				// child_process.execSync(cmd,{
				// 	stdio: 'inherit'
				// })
				// const
				// 	rmResult = cmds.exec(cmd)
				
				// if (rmResult.code !== 0) {
				// 		console.error(`Failed to clean path ${fullPath} with ${cmd}`)
				// }
			}
			
		} catch (err) {
			console.error(`Failed to clean app`, err)
		}
		
		console.log(`Finished cleaning, continuing`)
		break
	}
}


/**
 * Restart and clean the app
 */
export function restartAndClean() {
	
	const
		Electron = require('electron'),
		{remote} = Electron,
		app = remote && remote.app ? remote.app : Electron.app,
		opts = { args: process.argv.slice(1).concat(['--epic-clean']) } //process.argv.slice(1).filter(it => it !== 'clean').concat(['clean'])
	
	// if (DEBUG)
	// 	opts.args.unshift(process.argv[ process.argv.length - 1 ])
	
	console.log(`relaunching with args: ${opts.args}`)
	app.relaunch(opts)
	app.exit(0)
}

require('electron').ipcMain.on(Events.Clean,restartAndClean)