
const dataUrl = require('dataurl')

export function toDataUrl(template:Function,locals:any = {},mimetype:string = 'text/html'):string {
	return dataUrl.format({mimetype,data:template(locals)})
}
