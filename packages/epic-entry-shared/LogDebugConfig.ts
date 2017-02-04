Object.assign(global,{
	DEBUG_LOG(...args) {
		(console as any).log('** DEBUG_LOG **',...args)
	}
})

declare global {
	function DEBUG_LOG(...args)
}

export {
	
}