require('babel-polyfill')
require('shelljs/global')

const
	{platform} = process,
	isMac = platform	=== 'darwin',
	isWindows = platform === 'win32'


Object.assign(global,{
	isMac,
	isWindows,
	isLinux: !isMac && !isWindows
})
