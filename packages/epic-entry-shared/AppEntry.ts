import './SourceMapSupport'
import "./PromiseConfig"
import "./LogCategories"
import "./ProcessConfig"
import "./LogConfig"

import "./Env"
import "./NamespaceConfig"

import "./Globals"

import "./EventHub"
import "epic-registry"
import './NotificationCenter'



// HMR ACCEPT
if (module.hot) {
	module.hot.accept()
}

// EMPTY EXPORT
export {
	
}
