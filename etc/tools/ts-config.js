


export function makeTsConfig(dest,typingMode,...extraOpts) {
	const baseConfig = readJSONFileSync(`${baseDir}/tsconfig.json`)
	const tsConfigJson = _.merge({},baseConfig,...extraOpts)

	// tsConfigJson.exclude = tsConfigJson.exclude.concat(
	// 	typingMode === 'main' ? [
	// 		"typings/browser",
	// 		"typings/browser.d.ts"
	// 	] : [
	// 		"typings/main",
	// 		"typings/main.d.ts"
	// 	])
	writeJSONFileSync(dest,tsConfigJson)
	return dest
}