const log = getLogger(__filename)
const assert = require('assert')
const electron = require('electron')
const FormData = require('form-data')
const fetch = require('node-fetch')


export default class GitHubOAuthWindow {

	scopeQuery
	clientId
	clientSecret
	waitForApp
	remote:boolean
	window
	electron
	app
	BrowserWindow

	constructor(obj:any) {
		const
			{
				id,
				secret,
				remote,
				scopes = [],
				waitForApp = false
			} = obj
		
		assert.ok(id, 'Client ID is needed!')
		assert.ok(secret, 'Client Secret is needed!')
		
		this.scopeQuery = scopes.length > 0 ? '&scope=' + scopes.join('%2C') : ''
		this.clientId = id
		this.clientSecret = secret
		this.waitForApp = waitForApp
		this.remote = remote === true
		this.window = null
		this.electron = (this.remote || electron.remote) ? electron.remote : electron
		this.app = this.electron.app
		this.BrowserWindow = this.electron.BrowserWindow

	}



	startRequest(callback) {

		const doAuth = () => {
			this.window = new this.BrowserWindow({
				width: 1024,
				height: 768,
				webPreferences: {
					nodeIntegration: true, webSecurity: false
				}
			})


			const
				authURL = 'https://github.com/login/oauth/authorize?client_id=' + this.clientId + this.scopeQuery,
				{webContents} = this.window
			
			
			webContents.enableDeviceEmulation({fitToView:true})
			webContents.on('did-finish-load', () => {
				this.window.show()
				this.window.focus()
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
			this.window.on('close', () => {
				this.window = null
			}, false)

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

			//let text = await response.text()
			//console.log('response',text)
			//let json = await response.json()
			// const payload = text.split('&').reduce((vals,pair) => {
			// 	const parts = pair.split('=')
			// 	vals[parts[0]] = decodeURIComponent(parts[1])
			// 	return vals
			// },{})
			//
			// callback(null, payload.access_token, this)
		} catch (err) {
			log.error('auth failed',err)
			callback(err)
		} finally {
			onFinish()
		}
		//
		// request.post('https://github.com/login/oauth/access_token', {
		//   client_id: id,
		//   client_secret: secret,
		//   code: code,
		// }).end((err, response) => {
		//   try {
		//     if (err) {
		//
		//     } else {
		//
		//     }
		//   } finally {
		//     this.window.close()
		//   }
		// })
	}

}
