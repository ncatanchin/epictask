
export enum BuiltInTools {
	JobMonitor = 1
}

const DefaultTools = Object
	.keys(BuiltInTools)
	.filter(it => typeof BuiltInTools[it] === 'string')
	.reduce((toolNameMap,toolType) => {
		toolNameMap[toolType] = BuiltInTools[toolType]
		return toolNameMap
	},{})

export function getBuiltInToolId(builtInTool:BuiltInTools):string {
	const builtInToolName = DefaultTools[builtInTool]
	assert(builtInToolName,`No valid name found for ${builtInTool}`)
	return builtInToolName
}


