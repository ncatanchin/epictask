


export function makeTsConfig(dest,typingMode,opts) {
	const baseConfig = readJSONFileSync(`${baseDir}/tsconfig.json`)
	const tsConfigJson = _.merge({},baseConfig,opts)

	tsConfigJson.exclude = tsConfigJson.exclude.concat(
		typingMode === 'main' ? [
			"typings/browser",
			"typings/browser.d.ts"
		] : [
			"typings/main",
			"typings/main.d.ts"
		])
	writeJSONFileSync(dest,tsConfigJson)
	return dest
}