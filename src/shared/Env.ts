
const
	_ = require('lodash'),
	path = require('path'),
	g = global as any,
	isDev = process.env.NODE_ENV === 'development',
	isRemote = typeof process.env.REMOTE !== 'undefined',
	isOSX = process.platform === 'darwin',
	isRenderer = typeof window !== 'undefined' || process.type === 'renderer',
	isMain = process.type === 'browser',
	envName =  _.toLower(process.env.NODE_ENV || (isDev ? 'dev' : 'production'))


const Env = {
	envName,
	isOSX,
	isDev,
	isDebug: DEBUG && isDev,
	isHot: !_.isNil(process.env.HOT),
	isTest: !_.isNil(process.env.EPIC_TEST),
	isRemote,
	isRenderer,
	isMain,
	isElectron: ['browser','renderer'].includes(process.type),
	baseDir: path.resolve(__dirname,'../..')
}

export default Env