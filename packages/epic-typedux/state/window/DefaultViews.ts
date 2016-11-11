
import { makePromisedComponent } from "epic-global/UIUtil"

const
	DefaultViews = {
		IssuesPanel: {
			type: "IssuesPanel",
			loader: makePromisedComponent(resolver => require.ensure([],function(require:any) {
				resolver.resolve(require('epic-ui-components/pages/issues-panel').IssuesPanel)
			}))
		}
		
	}

export default DefaultViews