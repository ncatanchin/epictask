import * as  path from 'path'
import * as fs from 'fs'


namespace Cleaner {
	
	
	export const EPIC_ARG_CLEAN = '--epic-clean'
	
	export function isCleanRequested() {
		return process.argv.find(arg => arg === EPIC_ARG_CLEAN)
	}
	
	export function clean() {
		try {
			console.log(`Cleaning app`)
			const
				{ app } = require('electron'),
				
				dataPath = path.resolve(app.getPath('userData')),
				dataFiles = fs.readdirSync(dataPath),
				
				cmds = require('shelljs')
			
			for (let file of dataFiles) {
				if ([ 'epic', 'store-state', 'indexeddb','local','cache','databases','settings.json', 'sync-status.json' ].some(name => file.toLowerCase().indexOf(name) > -1)) {
					const
						fullPath = `${dataPath}${path.sep}${file}`
					
					
					console.log(`Cleaning ${fullPath}`)
					
					cmds.rm('-Rf', fullPath)
				}
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
		
	}
	
	
	/**
	 * Restart and clean the app
	 */
	export async function restartAndClean() {
		
		updateSettings({
			user: null,
			token: null
		})
		
		await Promise.delay(1000)
		
		const
			Electron = require('electron'),
			{remote} = Electron,
			app = remote && remote.app ? remote.app : Electron.app,
			opts = { args: process.argv.slice(1).concat([EPIC_ARG_CLEAN]) } //process.argv.slice(1).filter(it => it !== 'clean').concat(['clean'])
		
		// if (DEBUG)
		// 	opts.args.unshift(process.argv[ process.argv.length - 1 ])
		const
			browserWindows = [...Electron.BrowserWindow.getAllWindows()]
		
		for (let browserWindow of browserWindows) {
			try {
				browserWindow.close()
			} catch (err) {
				console.log(`unable to close window`,err)
			}
		}
		
		
		console.log(`relaunching with args: ${opts.args}`)
		app.relaunch(opts)
		app.quit()
		app.exit(0)
	}

	export function registerCleaner() {
		const
			{Events }= require("epic-global/Constants")
		
		require('electron').ipcMain.on(Events.Clean,Cleaner.restartAndClean)
	}
}


export default Cleaner