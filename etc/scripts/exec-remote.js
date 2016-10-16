require('babel-polyfill')

const
	path = require('path'),
	baseDir = path.resolve(__dirname,'..','..')

const
	spawn = require('child_process').spawn;

console.log(`args`,process.argv)
process.chdir(baseDir)
// Child will use parent's stdios
spawn(`powershell.exe`, ['-Command','npm','run',process.argv[2]], {
	cwd: baseDir,
	stdio: 'inherit'
})