// require('shared/SourceMapSupport')
import 'reflect-metadata'
// import './UILogging'
//
//
//
// async function boot() {
// 	// Load all global/env stuff first
// 	require('./UIGlobals')
//
// 	// Load logger
// 	const log = getLogger(__filename)
//
// 	// Load Styles
// 	require('./styles')
//
// 	// Now the theme manager
// 	require("./ThemeManager.tsx")
//
// 	log.info('Loading app root')
// 	const loadAppRoot = () => require('ui/components/root/AppRoot.tsx')
// 	loadAppRoot()
//
// 	if (module.hot) {
// 		module.hot.accept(['ui/components/root/AppRoot.tsx'], (updates) => {
// 			log.info('HMR Updates, reloading app content',updates)
// 			loadAppRoot()
// 		})
//
// 		module.hot.accept()
// 		module.hot.dispose(() => {
// 			log.info('HMR AppEntry Update')
// 		})
// 	}
// }
//
//
// boot().then(() => console.log('Booted App'))