import Electron = require('electron')

const log = getLogger(__filename)
const assert = require('assert')

const FormData = require('form-data')
const fetch = require('node-fetch')


export default class GitHubOAuthWindow {

	scopeQuery
	clientId
	clientSecret
	waitForApp
	remote:boolean
	window:Electron.BrowserWindow
	parentWindow:Electron.BrowserWindow
	electron:typeof Electron
	app
	BrowserWindow:typeof Electron.BrowserWindow

	constructor(parentWindow:Electron.BrowserWindow,obj:any) {
		const
			{
				id,
				secret,
				scopes = [],
				waitForApp = false
			} = obj,
			remote = obj.remote === true,
			electron = (remote || Electron.remote) ? Electron.remote : Electron,
			{BrowserWindow} = electron
			
		
		
		assert.ok(id, 'Client ID is needed!')
		assert.ok(secret, 'Client Secret is needed!')
		
		assign(this,{
			scopeQuery: scopes.length > 0 ? '&scope=' + scopes.join('%2C') : '',
			clientId: id,
			clientSecret: secret,
			waitForApp: waitForApp,
			remote: remote === true,
			window: null,
			electron,
			app: electron.app,
			BrowserWindow,
			parentWindow
		})
		
		
	}



	start(callback) {

		const doAuth = () => {
			
				
			
			this.window = new this.BrowserWindow({
				center: true,
				parent: this.parentWindow,
				modal: true,
				autoHideMenuBar: true,
				alwaysOnTop: true
			})


			const
				authURL = 'https://github.com/login/oauth/authorize?client_id=' + this.clientId + this.scopeQuery,
				{webContents} = this.window
			
			webContents.enableDeviceEmulation({fitToView:true} as any)
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

		(this.waitForApp) ? this.app.on('ready', doAuth) : doAuth()
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
