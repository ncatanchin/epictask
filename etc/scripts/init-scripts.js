require('babel-polyfill')
require('shelljs/global')

const
	path = require('path'),
	baseDir = path.resolve(__dirname,'..','..')


//cd(baseDir)
//process.chdir(baseDir)
console.log(`Set working directory to ${process.cwd()}`)

const
	{platform} = process,
	isMac = platform	=== 'darwin',
	isWindows = platform === 'win32'


Object.assign(global,{
	isMac,
	isWindows,
	isLinux: !isMac && !isWindows,
	WindowsEpicPath: `c:/users/jglanz/development/densebrain/epictask-workspace/epictask`,
	webpackCmd: path
		.resolve(
			process.cwd(),
			'node_modules',
			'.bin',
			`webpack${process.platform === 'win32' ? '.cmd' : ''}`
		)
	
})
