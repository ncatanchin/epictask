import { guard,Events } from "epic-global"

export * from "./WindowManager"

if (Env.isMain) {
	const
		{ app } = require('electron')
	
	app.on(
		Events.WindowStatesChanged,
		(windowStates) => guard(() => require('epic-typedux/provider').getAppActions())
	)
}