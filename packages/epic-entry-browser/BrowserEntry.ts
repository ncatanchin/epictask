__non_webpack_require__('babel-polyfill')
__non_webpack_require__('source-map-support').install()
__non_webpack_require__('reflect-metadata')



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
	const
		loadPkg = (pkgName:string) => {
			if (!(global as any).__NO_WEBPACK__)
				pkgName = `./${pkgName}.js`
				
			__non_webpack_require__(pkgName)
		}
	
	// LOAD THE DLL
	// if (!(global as any).__NO_WEBPACK__) {
	// 	Object.assign(global, {
	// 		epic_libs: __non_webpack_require__('./epic-common')
	// 	})
	// }
	//
	
	switch(process.env.EPIC_ENTRY) {
		case "DatabaseServer":
			loadPkg("epic-entry-database-server")
			break
		case "JobServer":
			loadPkg("epic-entry-job-server")
			break
		default:
			loadPkg("epic-entry-ui")
			break
	}
	
	
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
			paramStr = hash.substr(1)
		if (paramStr.indexOf('?') > -1) {
			paramStr = paramStr.substr(paramStr.indexOf('?') + 1)
		}
		
		let
			pairs = paramStr
				.split('&')
		
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
		EPIC_ENTRY: processType
	})
	
	_.assign(global, {
		_,
		$: (window as any).$ || require('jquery'),
		React: require('react'),
		ReactDOM: require('react-dom'),
		Radium: require('radium'),
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
			//__non_webpack_require__('devtron').install()
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

initBrowser((window as any).isDev)