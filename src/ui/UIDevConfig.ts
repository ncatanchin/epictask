
const log = getLogger(__filename)

try {
	const Reactotron = process.platform === 'darwin' && require('reactotron-react-js').default
	
	Reactotron
		.configure() // we can use plugins here -- more on this later
		.connect()
} catch (err) {
	log.error(`Failed to load reactotron`)
}

export {
	
}