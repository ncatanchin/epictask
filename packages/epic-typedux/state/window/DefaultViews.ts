
import { makePromisedComponent } from "epic-global/UIUtil"

const
	log = getLogger(__filename)

// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

const
	
	DefaultViews = {
		IssuesPanel: {
			type: "IssuesPanel",
			loader: makePromisedComponent(resolver => require.ensure([],function(require:any) {
				const
					modId = require.resolve('epic-ui-components/pages/issues-panel'),
					mod = __webpack_require__(modId)
				
				log.debug(`Loaded issues panel module`,mod.id,modId,mod)
				resolver.resolve(mod.IssuesPanel)
			}))
		}
		
	}

export default DefaultViews