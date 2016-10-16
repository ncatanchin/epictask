require('babel-polyfill')
//require('shelljs/global')

const
	path = require('path'),
	baseDir = path.resolve(__dirname,'..','..')

const
	spawn = require('child_process').spawn;

console.log(`args`,process.argv)

// Child will use parent's stdios
spawn(`npm.cmd`, ['run',process.argv[2]], {
	cwd: baseDir,
	stdio: 'inherit'
});