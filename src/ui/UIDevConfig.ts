
const log = getLogger(__filename)

try {
	const Reactotron = require('reactotron-react-js').default
	
	Reactotron
		.configure() // we can use plugins here -- more on this later
		.connect()
} catch (err) {
	log.error(`Failed to load reactotron`)
}