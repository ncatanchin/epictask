module.exports = global.WebpackStatsConfig = {
	colors: process.env.COLORS !== '0',
	//colors: true,
	errors: true,
	warnings: true,
	timings: true,
	errorDetails: true,
	assets: true, //true - shows all output assets
	//chunks: true,
	chunkModules: false,
	hash: false,
	reasons: false,
	modules: false,
	chunkOrigins: false
}
