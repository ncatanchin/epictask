module.exports = global.WebpackStatsConfig = {
	colors: process.env.COLORS !== '0',
	errorDetails: true,
	assets: true,
	chunks: true,
	chunkModules: false,
	hash: false,
	reasons: false,
	modules: false,
	chunkOrigins: false
}
