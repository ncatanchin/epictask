

export async function storeBuilder(enhancer = null) {
	
	return await require('./AppStore').loadAndInitStorybookStore()
	
}