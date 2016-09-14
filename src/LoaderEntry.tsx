import * as assert from 'assert'
import {Loader} from "ui/components/common/Loader"
import * as Constants from 'shared/Constants'
import Electron = require('electron')



// Set the process type
// @see AppEntry.ts
//process.env.EPIC_ENTRY = 'UI'

function startLoaderEntry() {
	const
		log = console,
		loaderRoot = document.getElementById('loader-root'),
		loaderElem = $(loaderRoot)
	
	assert(loaderRoot,`Unable to find element #loader-root`)
	
	ReactDOM.render(<Loader animate />,loaderRoot,() => {
		log.info(`Rendered loader`)
		
		// Notify the main process that the loader is running
		Electron.ipcRenderer.send('epictask-loader-ready')
		
		loaderElem.addClass('visible')
	})
	
	let
		loaded = false,
		checkTimer = null
	
	function loadApp() {
		if (checkTimer) {
			clearTimeout(checkTimer)
			checkTimer = null
		}
		
		if (loaded) {
			log.info(__filename,`Already loaded app entry`)
			return
		}
		
		const win = window as any
		win.stopLoader = () => {
			loaderElem.removeClass('visible')
			setTimeout(() => ReactDOM.unmountComponentAtNode(loaderRoot),500)
		}
		
		log.info(`Loading AppEntry`)
		loaded = true
		
		//win.addScript('./AppEntry.bundle.js',true)
		win.loadApp()
		
	}
	
	loadApp()
	
	//
	// /**
	//  * On main ready complete boot
	//  */
	// Electron.ipcRenderer.once(Constants.Events.MainReady,(event) => {
	// 	log.info(`Received MainReady`)
	//
	// })
	//
	// /**
	//  * Check if the Main process has already booted
	//  */
	// function checkIfMainIsReady() {
	// 	if (loaded)
	// 		return
	// 	if (Electron.remote.getGlobal(Constants.MainBooted)) {
	// 		log.info(`Main is booted, load UI`)
	// 		loadApp()
	// 	} else {
	// 		checkTimer = setTimeout(checkIfMainIsReady,300)
	// 	}
	// }
	//
	// checkIfMainIsReady()
	
}


_.assign(window,{
	startLoaderEntry
})