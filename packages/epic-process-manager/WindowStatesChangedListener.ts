


import { Events } from "epic-global/Constants"
import { guard } from "epic-global/ObjectUtil"

const
	log = getLogger(__filename)

if (Env.isMain) {
	const
		{ app } = require('electron')
	
	app.on(
		Events.WindowStatesChanged,
		(windowStates) => {
			
			guard(() => require('epic-typedux/provider')
				.getAppActions()
				.updateWindow(true,...windowStates))
		}
	)
}