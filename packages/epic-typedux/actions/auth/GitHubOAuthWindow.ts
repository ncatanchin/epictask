import Electron from 'epic-electron'
import { getValue } from "epic-global/ObjectUtil"

const
	log = getLogger(__filename),
	FormData = require('form-data')
	fetch = require('node-fetch')

function getApp() {
	return getValue(() => Electron.remote.app,Electron.app)
}

function getBrowserWindow() {
	return getValue(() => Electron.remote.BrowserWindow,Electron.BrowserWindow)
}


export default class GitHubOAuthWindow {

	scopeQuery
	clientId
	clientSecret
	waitForApp
	remote:boolean
	window:Electron.BrowserWindow
	parentWindow:Electron.BrowserWindow
	electron:typeof Electron
	callback:Function

	constructor(parentWindow:Electron.BrowserWindow,obj:any) {
		const
			{
				id,
				secret,
				scopes = [],
				waitForApp = false
			} = obj
			
			
		
		assert(id, 'Client ID is needed!')
		assert(secret, 'Client Secret is needed!')
		
		assign(this,{
			scopeQuery: scopes.length > 0 ? '&scope=' + scopes.join('%2C') : '',
			clientId: id,
			clientSecret: secret,
			waitForApp: waitForApp,
			window: null,
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
	 
	
	start(callback) {
		this.callback = callback
		
		const
			doAuth = () => {
				
					
				const
					BrowserWindow = getBrowserWindow(),
					
					authURL = 'https://github.com/login/oauth/authorize?client_id=' + this.clientId + this.scopeQuery,
					
					{webContents} = this.window = new BrowserWindow({
						center: true,
						//parent: this.parentWindow,
						modal: !DEBUG,
						autoHideMenuBar: true,
						alwaysOnTop: true
					})
				
				webContents.enableDeviceEmulation({fitToView:true} as any)
				
				webContents.openDevTools()
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
		let raw_code = /code=([^&]*)/.exec(url) || null
		let code = (raw_code && raw_code.length > 1) ? raw_code[1] : null
		let error = /\?error=(.+)$/.exec(url)

		if (code) {
			this.requestGithubToken(this.clientId, this.clientSecret, this.scopeQuery, code, callback)
		} else if (error) {
			console.log(error)
		}
	}

	async requestGithubToken(id, secret, scopes, code, callback) {
		const onFinish = () => {
			this.window.close()
		}

		try {
			const body = new FormData()
			body.append('client_id', id)
			body.append('client_secret', secret)
			body.append('code', code)


			let response = await fetch('https://github.com/login/oauth/access_token', {
				method: 'POST',
				body,
				headers: { accept: 'application/json' },
				cache: 'no-cache'
			})

			const json = await response.json()
			callback(null, json.access_token, this)

		} catch (err) {
			log.error('auth failed',err)
			callback(err)
		} finally {
			onFinish()
		}

	}

}
