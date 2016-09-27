
export function focusElementById(id:string,timeout = 50) {
	if (ProcessConfig.isType(ProcessType.UI))
		setTimeout(() => $(`#${id}`).focus(),timeout)
}


export function isReactComponent(c:any):c is React.Component<any,any> {
	return c && (
			c instanceof React.Component ||
			(c.prototype && c.prototype.isPrototypeOf(React.Component))
		)
}


