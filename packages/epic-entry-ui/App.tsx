import {
	Events,
	acceptHot,
	addHotDisposeHandler,
	If,
	benchmarkLoadTime
} from "epic-global"


//import AppRoot from "epic-entry-ui/AppRoot"
import {getReduxStore} from 'epic-typedux/store/AppStore'
import { ThemeEvent } from "epic-styles/ThemeState"
const
	log = getLogger(__filename),
	windowId = getWindowId(),
	win = window as any

let
	rootElement = document.getElementById('root'),
	AppRoot,
	appRef,
	renderCount = 1

/**
 * Render App in appRoot node
 */

function render() {
	AppRoot = require('./AppRoot').default
	
	win.appRefDirect = ReactDOM.render(
		<AppRoot key={renderCount} store={getReduxStore()}/>,
		
		// ROOT ELEMENT TO MOUNT ON
		rootElement,
		
		/**
		 * After Initial render
		 */
		(ref) => {
			appRef = ref
			
			// BENCHMARK
			benchmarkLoadTime(`render window ${windowId ? windowId : 'main window'}`)
			
			/**
			 * If main ui then stop load spinner
			 */
			If(ProcessConfig.isUI(), () => {
				require('electron').ipcRenderer.send(Events.UIReady)
			})
			
			require("epic-plugins-default")
		}
	)
	
	// if (module.hot) {
	// 	require('react-hot-loader/Injection').RootInstanceProvider.injectProvider({
	// 		getRootInstances: function () {
	// 			// Help React Hot Loader figure out the root component instances on the page:
	// 			return [ win.appRefDirect ];
	// 		}
	// 	});
	// }
}

/**
 * Unmount, clear cache and fully reload
 */
function remount() {
	
	// try {
	// 	// let
	// 	// 	rootNode = ReactDOM.findDOMNode(rootElement)
	// 	//
	// 	ReactDOM.unmountComponentAtNode(rootElement)
	// } catch (err) {
	// 	log.warn(`Failed to unmount`,err)
	// }
	// $('#root').remove()
	//
	//
	//
	//
	// const
	// 	AppRootResolvedPath = require.resolve('./AppRoot'),
	// 	webContents = require('electron').remote.getCurrentWebContents()
	//
	// log.info(`Unmounted!`, win.appRefDirect)
	// delete win.appRefDirect
	// delete require.cache[AppRootResolvedPath]
	//
	// setTimeout(() => {
	// 	renderCount++
	// 	rootElement = $(`<div id="root"></div>`).appendTo($('body'))[0]
	// 	render()
	// },300)
	
	// Object
	// 	.keys(require.cache)
	// 	.forEach(key => delete require.cache[key])
	//
	// render()
	
	//webContents.reload()
}

if (DEBUG) {
	assignGlobal({
		epicRender: render,
		epicRemount: remount
	})
}

function themeChangeListener() {
	log.info(`Remounting on theme change`)
	remount()
}


benchmarkLoadTime(`Exporting loadUI`)
export function loadUI(pendingResources:Promise<void>) {
	benchmarkLoadTime(`Waiting for UI resources`)
	
	pendingResources.then(() => {
		
		benchmarkLoadTime(`UI Resources loaded, now loading UI`)
		/**
		 * On a complete theme change, destroy everything
		 */
		EventHub.on(EventHub.ThemeChanged,themeChangeListener)
		
		// ADD HMR REMOVE
		addHotDisposeHandler(module,() => EventHub.on(EventHub.ThemeChanged,themeChangeListener))
		
		render()
		
	})
}



/**
 * Enable HMR
 */
//acceptHot(module, log)
if (module.hot) {
	
	

	
	
	module.hot.accept("./AppRoot", () => {
		log.info('Reloading root')
		render()
	});
}