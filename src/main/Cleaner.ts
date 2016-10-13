import path = require('path')
import child_process = require('child_process')

for (let arg of process.argv) {
	if (arg === 'clean') {
		try {
			console.log(`Cleaning app`)
			const
				{app} = require('electron'),
				
				dataPath = path.resolve(app.getPath('userData')),
				
				cmds = require('shelljs')
			
			for (let file of ['epictask-*','store-state','settings.json','sync-status.json']) {
				const
					fullPath = `${dataPath}${path.sep}${file}`
				
				console.log(`Cleaning ${fullPath}`)
				
				cmds.rm('-Rf',fullPath)
				
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
			console.error(`Failed to clean app`,err)
		}
		
		console.log(`Finished cleaning, continuing`)
		break
	}
}

export {
	
}