


export function makeTsConfig(dest,opts) {
	const baseConfig = readJSONFileSync(`${baseDir}/tsconfig.json`)
	const tsConfigJson = _.merge({},baseConfig,opts)

	writeJSONFileSync(dest,tsConfigJson)
	return dest
}