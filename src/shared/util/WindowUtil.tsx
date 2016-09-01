import {FillNoSpacing} from "shared/themes/styles/CommonStyles"
import {getReduxStore} from "shared/store"
import {Provider} from "react-redux"
import {MuiThemeProvider} from "material-ui/styles"
import {getTheme} from "shared/themes/ThemeManager"

import {ContentRoot} from "ui/components/root/ContentRoot"

const log = getLogger(__filename)
/**
 * Open a child window and render React component into it as root
 */
export function openChildWindow(name:string,component) {
	if (Env.isMain || typeof window === 'undefined') {
		log.warn(`WINDOW NOT DEFINED: Child windows can only be opened in a browser window or on the renderer in electron`,Env.isMain)
	} else {
		const
			ReactDOM = require('react-dom'),
			$ = require('jquery'),
			//emptyTemplate = dataUrl.format({mimetype:'text/html',data:'<html></html>'}),
			//childWin:Window = window.open(emptyTemplate,name) as any
			childWin:Window = window.open("",name) as any
		
		log.info('Created window',childWin)
		
		const
			theme = getTheme(),
			childDoc = $(childWin.document),
			childRootElem = $(childWin.document.createElement('div')).css(FillNoSpacing)
		
		// Find or create body
		const htmlElem = childDoc.find('html').css(FillNoSpacing)
		
		let headElem = htmlElem.find('head')
		if (!headElem.length)
			headElem = $(childWin.document.createElement('head')).appendTo(htmlElem)
		
		// headElem.append(`
		// 	<link rel="stylesheet" href="${window.location.protocol}//${window.location.host}${require('!!file!animate.css/animate.css')}"></link>
		// 	<link rel="stylesheet" href="${window.location.protocol}//${window.location.host}${require('!!file!font-awesome/css/font-awesome.min.css')}"></link>
		// 	<link rel="stylesheet" href="${window.location.protocol}//${window.location.host}${require('!!file!highlight.js/styles/dark.css')}"></link>
		// 	<link rel="stylesheet" href="${window.location.protocol}//${window.location.host}${require('!!file!simplemde/dist/simplemde.min.css')}"></link>
		// 	<link rel="stylesheet" href="${window.location.protocol}//${window.location.host}${require('!!file!sass!assets/fonts/fonts.global.scss')}"></link>
		// 	<link rel="stylesheet" href="${window.location.protocol}//${window.location.host}${require('!!file!sass!styles/split-pane.global.scss')}"></link>
		// `)
						
		let bodyElem = childDoc.find('body')
		if (!bodyElem.length)
			bodyElem = $(childWin.document.createElement('body')).appendTo(htmlElem)
		
		bodyElem.css(FillNoSpacing).append(childRootElem)
		
		Object.assign(childWin.document.getElementsByTagName('html')[0].style,theme.app)
		Object.assign(childWin.document.getElementsByTagName('body')[0].style,theme.app)
		
		ReactDOM.render(<MuiThemeProvider muiTheme={getTheme()}>
			<Provider store={getReduxStore()}>
				<ContentRoot>{component}</ContentRoot>
			</Provider>
		</MuiThemeProvider>,childRootElem[0])
	}
}
	