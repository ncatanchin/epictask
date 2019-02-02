import * as assert from 'assert'
import {app, BrowserWindow, session, ipcMain} from 'electron'
import axios from 'axios'
import getLogger from "../common/log/Logger"
import {guard} from "typeguard"
import {getConfig, updateConfig} from "../common/config/ConfigHelper"
import EventHub from "../common/events/Event"
import {AuthScopeRequired} from "common/config/Config"

const log = getLogger(__filename)


log.info("Loading Auth")

let authWindow:AuthWindow | null = null



export type AuthWindowCallback =
	(result:string | null, err?:Error | null) => void

export function register():void {
	EventHub.on("AuthStart", authenticate)
}

function cleanup():void {
	if (authWindow) {
		guard(() => authWindow.destroy())
		authWindow = null
	}
}

export function authenticate():void {
	if (isAuthenticated() || isAuthenticating())
		return

	log.info("Authenticating")
	cleanup()


	authWindow = new AuthWindow({
		id: "70942b2e030b4d09bce1",
		secret: "f0b51ec8dc02c3de4848a74536a608cade87ac45",
		scopes: AuthScopeRequired
	})

	authWindow.startRequest((accessToken:string,err:Error) => {
		log.info("Access token", accessToken, "Error", err)
		updateConfig({accessToken,scope: AuthScopeRequired})
		EventHub.emit("AuthComplete", accessToken, AuthScopeRequired)
		cleanup()
	})
}

export function isAuthenticating():boolean {
	return !!authWindow
}

export function isAuthenticated():boolean {
	const config = getConfig()
	return !!config.accessToken &&
		AuthScopeRequired.every(scope => (config.scope || []).includes(scope))
}

class AuthWindow {

	private scopes = Array<string>()
	private clientId = ""
	private clientSecret = ""
	private window:BrowserWindow | null = null
	private callback:AuthWindowCallback | null = null


	constructor({id, secret, scopes = []}:{
		id:string
		secret:string
		scopes:Array<string>
	}) {
		assert(id, 'Client ID is needed!')
		assert(secret, 'Client Secret is needed!')
		this.scopes = scopes
		this.clientId = id
		this.clientSecret = secret
	}

	destroy() {
		if (this.window) {
			this.window.destroy()
			this.window = null
		}
	}

	startRequest(callback:AuthWindowCallback) {
		this.callback = callback;
		this.window = new BrowserWindow({width: 800, height: 600, webPreferences: {nodeIntegration: false}})

		if (process.env.devToolsOpen)
			this.window.webContents.openDevTools()

		// this.window.webContents.on("did-start-navigation",(event) => {
		// 	console.error("start nav", event)
		// })
		// this.window.webContents.on("did-finish-load",(event) => {
		// 	console.error("finish load", event)
		// })
		// this.window.webContents.on("did-fail-load",(err) => {
		// 	console.error("fail load", err)
		// })
		this.window.webContents.on('will-navigate', (event, url) => {
			log.info("will nav",url)
			this.handleCallback(url)
		})

		this.window.webContents.session.webRequest.onErrorOccurred(err => {
			const {url} = err
			this.handleCallback(url)
		})
		this.window.webContents.session.webRequest.onBeforeRedirect(({redirectURL: url}) => {
			this.handleCallback(url)
		})
		this.window.on('close', () => {
			this.window = null
			session.defaultSession.webRequest.onBeforeRedirect(null)
			session.defaultSession.webRequest.onErrorOccurred(null)
		})

		const authURL = 'https://github.com/login/oauth/authorize?client_id=' + this.clientId + '&scope=' + this.scopes
		this.window.loadURL(authURL)
		this.window.reload()
		this.window.show()

	}

	handleCallback(url) {
		const rawCode = /code=([^&]*)/.exec(url)
		const code = (rawCode && rawCode.length > 1) ? rawCode[1] : null
		if (code) {
			this.requestGithubToken(code)
		}
	}

	requestGithubToken(code) {
		axios({
			method: 'post', url: 'https://github.com/login/oauth/access_token',
			headers: {
				Accept: "application/json"
			},
			data: {
				client_id: this.clientId,
				client_secret: this.clientSecret,
				code: code
			},
			responseType: 'json'
		}).then((response:any) => {
			if (this.window)
				this.window.destroy()
			//log.info(response)
			this.callback(response.data.access_token)
		}).catch(err => this.callback(null, err))
	}

}
