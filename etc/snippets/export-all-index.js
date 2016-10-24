module.exports = () => {
	ls()
		.filter(it => !it.startsWith('index'))
		.reduce((txt = '', it) => {
			txt += `export * from "./${it.replace(/\.(js|tsx?)$/,'')}"\n`
			return txt
		})
		.toEnd('index.ts')
}
