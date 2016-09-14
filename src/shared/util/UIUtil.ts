export function focusElementById(id:string,timeout = 50) {
	if (ProcessConfig.isType(ProcessType.UI))
		setTimeout(() => $(`#${id}`).focus(),timeout)
}