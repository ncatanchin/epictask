//import * as Electron from 'electron'

let
	electron:Electron.ElectronMainAndRenderer

const electronProxy = new Proxy({},{
	get(noop,prop) {
		if (!electron)
			electron = require('electron')
		
		return electron[prop]
	}
}) as Electron.ElectronMainAndRenderer

export default electronProxy