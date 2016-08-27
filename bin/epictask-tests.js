
/**
 * No load the main entry
 */

Object.assign(process.env,{
	EPIC_ENTRY: 'Test',
	EPIC_TEST: true
})

// const
// 	path = require('path'),
// 	distOut = path.resolve(process.cwd(),'dist/out'),
// 	src = path.resolve(process.cwd(),'src')
//
// global.DEBUG=true
//
// const {globalPaths} = require('module')
//globalPaths.push(distOut,src)
//process.env.NODE_PATH = process.cwd() + "/dist/out:" + process.env.NODE_PATH
require('../dist/AppEntry')

