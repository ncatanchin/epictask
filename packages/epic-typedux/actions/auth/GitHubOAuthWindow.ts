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



	start(callback) {

		const doAuth = () => {
			
				
			const
				BrowserWindow = getBrowserWindow()
			
			


			const
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
			webContents.on('did-finish-load', () => {
				try {
					if (this.window && !this.window.isDestroyed() && this.window.isClosable()) {
						this.window.show()
						this.window.focus()
					}
				} catch (err) {
					log.warn(`Failed to focus window`,err)
				}
			})

			webContents.on('did-fail-load',(event,errorCode,errorDescription,validatedURL,isMainFrame) => {
				console.error('LOAD FAILED',event,errorCode,errorDescription,validatedURL,isMainFrame)
				callback({errorCode,errorDescription,validatedURL,isMainFrame})
			})

			webContents.on('will-navigate', (event, url) => {
				this.handleCallback(url, callback)
			})
			webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
				this.handleCallback(newUrl, callback)
			})
			this.window.on('closed', () => {
				this.window = null
			})

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
