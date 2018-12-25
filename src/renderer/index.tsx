import 'source-map-support/register'
import "./assets/fonts/fonts.global.scss"
import "./assets/css/global.scss"
import { setConfig } from 'react-hot-loader'

setConfig({
//	pureRender: true
})

import {EventEmitter} from "events"
import "./Env"

import * as React from "react"
import * as ReactDOM from "react-dom"
import {loadAndInitStore} from "./store/AppStore"

EventEmitter.defaultMaxListeners = Number.MAX_VALUE

const
	$ = require("jquery"),
	appEl = $("#app")


$("body, #app").css({
	width: "100vw",
	maxWidth: "100vw",
	height: "100vh",
	maxHeight: "100vh",
	overflow: "hidden",
	border: 0,
	margin: 0,
	padding: 0
})

let rendered = false

async function renderRoot():Promise<void> {
	const doRender = ():void => {
		if (rendered)
			return
		
		rendered = true
		const
			{Provider} = require("react-redux"),
			Root = require("./Root").default

		ReactDOM.render(
			<Provider store={getReduxStore()}>
				<Root/>
			</Provider>,
			appEl[0]
		)
	}
	
	loadAndInitStore()
	await (await import("./watchers")).default
	await (await import("./init")).default
	
	doRender()
}

// noinspection JSIgnoredPromiseFromCall
renderRoot()
