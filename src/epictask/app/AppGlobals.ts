// Retrieve the getTheme method from the theme manager
import "./ThemeManager"
//import * as ReactGlobal from 'react'
import ReactGlobal = require('react')
import * as ReactDOMGlobal from 'react-dom'

declare global {
	var CSSModules:any
	var React:typeof ReactGlobal
	var ReactDOM:typeof ReactDOMGlobal
}

Object.assign(global,{
	CSSModules: require('react-css-modules'),
	React: ReactGlobal,
	ReactDOM: ReactDOMGlobal
})

export {

}