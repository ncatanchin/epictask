__non_webpack_require__('babel-polyfill')

const
	win = window as any

/**
 * Benchmarks for performance
 * measurement on initial window load
 *
 * @param name
 */
function logBenchmark(name) {
	if (DEBUG)
		console.log(`Time to ${name} is ${(Date.now() - win.startLoadTime) / 1000}s`)
}

/**
 * Load app
 */
function loadApp() {
	__non_webpack_require__('./AppEntry.bundle.js')
}


// EXPOSE LOAD APP GLOBALLY
win.loadApp = loadApp


/**
 * Init browser window
 *
 * @param isDev
 */
export function initBrowser(isDev) {
	let
		{ hash } = window.location,
		_ = __non_webpack_require__('lodash')
	
	function parseParams() {
		let
			pairs = hash.substr(1).split('&')
		
		return pairs.reduce(function (map, nextPair) {
			const
				parts = nextPair.split('=')
			
			if (parts.length === 2)
				map[ parts[ 0 ] ] = parts[ 1 ]
			return map
		}, {}) as any
	}

//noinspection NpmUsedModulesInstalled
	let
		electron = require('electron'),
		params = parseParams(),
		log = console,
		loaded = false,
		loaderReady = false,
		docReady = false,
		fontsReady = false,
		processType = params.EPIC_ENTRY || 'UI',
		isChildWindow = processType === 'UIChildWindow'
	
	_.assign(process.env, {
		EPIC_WINDOW_ID: params.EPIC_WINDOW_ID,
		EPIC_ENTRY: processType
	})
	
	_.assign(global, {
		_: _,
		$: require('jquery'),
		React: require('react'),
		ReactDOM: require('react-dom'),
		getLogger: function (loggerName) {
			return console
		}
	})
	logBenchmark('After globals')
	
	try {
		require('react-tap-event-plugin')()
	} catch (err) {
		log.info('Failed to inject tap event handler = HMR??')
	}
	
	if (DEBUG && !isChildWindow) {
		try {
			__non_webpack_require__('devtron').install()
		} catch (err) {
			log.info(`Dev tron is prob already loaded`)
		}
	}
	
	
	function loadUI() {
		
		// DISPLAY THE LOADER
		function showLoader() {
			if (isChildWindow) {
				log.info(`Child window does not load LoaderEntry`)
				return
			}
			log.info('Template Ready state', fontsReady, docReady, loaderReady)
			if (docReady && loaderReady)
				win.startLoaderEntry()
		}
		
		
		// CHILD WINDOW - LOAD IMMEDIATE
		logBenchmark('Loading app')
		loadApp()
		logBenchmark('Loaded app')
	 
	}
	
	// IN DEV MODE - install debug menu
	if (isDev) {
		__non_webpack_require__('debug-menu').install()
	}
	
	logBenchmark('To load')
	if (processType === 'UI' || processType === 'UIChildWindow') {
		loadUI()
	} else {
		loadApp()
	}
	
}