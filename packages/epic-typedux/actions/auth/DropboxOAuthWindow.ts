import Electron from 'epic-electron'
import { getValue } from "typeguard"
import { getDropboxClient, guard } from "epic-global"


const
	log = getLogger(__filename)

log.setOverrideLevel(LogLevel.DEBUG)

const
	FormData = require('form-data')

fetch = require('node-fetch')

function getApp() {
	return getValue(() => Electron.remote.app,Electron.app)
}

function getBrowserWindow() {
	return getValue(() => Electron.remote.BrowserWindow,Electron.BrowserWindow)
}


export default class DropboxOAuthWindow {
	
	remote:boolean
	window:Electron.BrowserWindow
	parentWindow:Electron.BrowserWindow
	electron:typeof Electron
	callback:Function
	
	constructor(parentWindow:Electron.BrowserWindow) {
		
		
		assign(this,{
			parentWindow
		})
		
	}
	
	onNavigate = (event, url) => {
		this.handleCallback(url, this.callback)
	}
	
	/**
	 * On Finish load
	 */
	onFinishLoad = () => {
		try {
			if (this.window && !this.window.isDestroyed() && this.window.isClosable()) {
				this.window.show()
				this.window.focus()
			}
		} catch (err) {
			log.warn(`Failed to focus window`,err)
		}
	}
	
	onFailLoad = (event,errorCode,errorDescription,validatedURL,isMainFrame) => {
		console.error('LOAD FAILED',event,errorCode,errorDescription,validatedURL,isMainFrame)
		this.callback({errorCode,errorDescription,validatedURL,isMainFrame})
	}
	
	onRedirect = (event, oldUrl, newUrl) => {
		this.handleCallback(newUrl, this.callback)
	}
	
	onClosed = () => {
		this.window = null
	}
	
	close() {
		guard(() => this.window.close())
	}
	
	start(callback) {
		this.callback = callback
		
		const
			doAuth = () => {
				
				
				const
					Dropbox = getDropboxClient(),
					BrowserWindow = getBrowserWindow(),
					
					authURL = Dropbox.getAuthenticationUrl('http://localhost/epictask/auth'),
					
					{webContents} = this.window = new BrowserWindow({
						center: true,
						//parent: this.parentWindow,
						modal: true,// !DEBUG,
						autoHideMenuBar: true,
						alwaysOnTop: true
					})
				
				log.debug(`Auth URL to use: ${authURL}`)
				
				webContents.enableDeviceEmulation({fitToView:true} as any)
				
				//webContents.openDevTools()
				webContents.on('did-finish-load', this.onFinishLoad)
				webContents.on('did-fail-load',this.onFailLoad)
				webContents.on('will-navigate', this.onNavigate)
				webContents.on('did-get-redirect-request', this.onRedirect)
				this.window.on('closed',this.onClosed)
				this.window.loadURL(authURL)
			}
		
		//(this.waitForApp) ? getApp().on('ready', doAuth) : doAuth()
		doAuth()
	}
	
	handleCallback(url, callback) {
		log.debug(`Callback url: ${url}`)
		
		let
			rawAccessToken = /access_token=([^&]*)/.exec(url) || null,
			accessToken = (rawAccessToken && rawAccessToken.length > 1) ? rawAccessToken[1] : null,
			//let code = (raw_code && raw_code.length > 1) ? raw_code[1] : null
		
			error = /\?error=(.+)$/.exec(url)
		
		if (accessToken) {
			log.debug(`Parsed token: ${accessToken}`)
			callback(null, accessToken, this)
			this.close()
		} else if (error) {
			console.log(error)
			callback(new Error(<any>error))
			this.close()
		}
		
	}
	
	// async requestToken(code, callback) {
	// 	const onFinish = () => {
	// 		//require('electron').remote.getCurrentWindow().close()
	// 		this.window.close()
	// 	}
	//
	// 	try {
	// 		const body = new FormData()
	// 		body.append('client_id', id)
	// 		body.append('client_secret', secret)
	// 		body.append('code', code)
	//
	//
	// 		let response = await fetch('https://github.com/login/oauth/access_token', {
	// 			method: 'POST',
	// 			body,
	// 			headers: { accept: 'application/json' },
	// 			cache: 'no-cache'
	// 		})
	//
	// 		const json = await response.json()
	// 		callback(null, json.access_token, this)
	//
	// 	} catch (err) {
	// 		log.error('auth failed',err)
	// 		callback(err)
	// 	} finally {
	// 		onFinish()
	// 	}
	//
	// }
	
}
