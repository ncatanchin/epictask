import * as moment from 'moment'

export function getMillis(val:string|number|Date):number {
	return moment(val).valueOf()
}