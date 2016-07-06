const path = require('path')
const fs = require('fs')

const tsConfigBaseFile = () => `${baseDir}/src/tsconfig.json`

export function makeTsConfigBase() {
	const templateConfig = require('../tsconfig.json')

	Object.assign(templateConfig.compilerOptions,{
		baseUrl: path.resolve(baseDir,'src')
	})

	writeJSONFileSync(tsConfigBaseFile(),templateConfig)
	const rootTsConfigFile = `${baseDir}/tsconfig.json`
	fs.unlinkSync(rootTsConfigFile)
	fs.linkSync(tsConfigBaseFile(),rootTsConfigFile)
}

export function makeTsConfig(dest,typingMode,...extraOpts) {


	const baseConfig = readJSONFileSync(tsConfigBaseFile())

	// Object.assign(baseConfig.compilerOptions,{
	// 	baseUrl: `./src`,
	// 	outDir: `../dist`
	// })

	Object.assign(baseConfig,{
		// exclude: baseConfig.exclude.map(excludePath => path
		// 	.relative(
		// 		baseDir,
		// 		path.resolve(`${baseDir}/src`,excludePath)
		// 	))
		exclude: baseConfig.exclude.map(excludePath => {
			return _.startsWith(excludePath,'../') ? excludePath.substring(3) : excludePath
		})
	})
	const tsConfigJson = _.merge({},baseConfig,...extraOpts)

	writeJSONFileSync(dest,tsConfigJson)
	return dest
}