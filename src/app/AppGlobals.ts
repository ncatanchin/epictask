
import * as ReactGlobal from 'react'

declare global {
	var CSSModules:any
	var React:typeof ReactGlobal

}

Object.assign(global,{
	CSSModules: require('react-css-modules'),
	React: ReactGlobal
})

export {

}