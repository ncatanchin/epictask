import { acceptHot } from "epic-global"
import { getUIActions } from "epic-typedux"
import { getBuiltInToolId, BuiltInTools } from "epic-ui-components"

export * from "./JobDetail"
export * from "./JobItem"
export * from "./JobList"
export * from "./JobMonitor"


CommandRegistryScope.Register({
	id: 'ToggleJobMonitor',
	type: CommandType.App,
	name: 'Toggle Job Monitor',
	execute: (item, event) => getUIActions().toggleTool(getBuiltInToolId(BuiltInTools.JobMonitor)),
	defaultAccelerator: "CommandOrControl+J"
})

acceptHot(module)