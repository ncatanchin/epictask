try {
	require('babel/register')
} catch (err) {}

try {
	require('babel-polyfill')
} catch (err) {}

require('shelljs/global')




const
	path = require('path'),
	{process} = global,
	baseDir = path.resolve(__dirname,'..','..')

/**
 * Exec cmd
 *
 * @param cmd
 * @param onError
 */
function execNoError(cmd,onError = null) {
	const
		result = exec(cmd)
	
	if (result.code !== 0) {
		if (!onError || onError(result) !== false) {
			process.exit(result.code)
		}
	}
	
	return result
}


//cd(baseDir)
// process.chdir(baseDir)
//console.log(`Set working directory to ${process.cwd()}`)

const
	{platform} = process,
	isMac = platform	=== 'darwin',
	isWindows = platform === 'win32'


Object.assign(global,{
	execNoError,
	isMac,
	isWindows,
	isLinux: !isMac && !isWindows,
	platformName: isWindows ? 'windows' : isMac ?  'macos' : 'linux',
	WindowsEpicPath: `c:/users/jglanz/development/densebrain/epictask-workspace/epictask`,
	
	/**
	 * Ensures that required directories exist
	 */
	prepareDirs() {
		const
			homeDir = process.env.HOME,
			hostname = require('os').hostname(),
			mkRamDiskCmd = `${homeDir}/Dropbox/Home/bin/mk-ramdisk.sh`,
			awCacheExists = test('-d','dist/.awcache'),
			mkRamDiskCmdExists = test('-e',mkRamDiskCmd)
		
		
		if (!awCacheExists) {
			if (mkRamDiskCmdExists && hostname === 'linux-dev') {
				echo(`Creating ramdisk`)
				exec(`sudo rm -R ${process.cwd()}/dist`)
				exec(`sudo ${mkRamDiskCmd} epic-ramdisk 6g ${process.cwd()}/dist`)
			} else {
				mkdir(`-p`,`dist/.awcache`)
			}
		}
	},
	
	/**
	 * Webpack command
	 */
	webpackCmd: path
		.resolve(
			process.cwd(),
			'node_modules',
			'.bin',
			`webpack${process.platform === 'win32' ? '.cmd' : ''}`
		)
	
})
