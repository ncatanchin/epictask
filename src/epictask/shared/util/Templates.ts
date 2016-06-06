const log = getLogger(__filename)

const dataUrl = require('dataurl')

export function toDataUrl(template:Function|string,locals:any = {},mimetype:string = 'text/html'):string {
	if (typeof template === 'function') {
		template = template(locals) as string

	}
	log.info('Using template',template)
	return dataUrl.format({mimetype,data:template})
}
