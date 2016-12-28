import {Record,List,Map} from 'immutable'

export const TrayStateRecord = Record({
	open: false,
	alwaysOnTop: false,
	autoHide: true
})


export class TrayState extends TrayStateRecord {
	
	static fromJS(o:any):TrayState {
		return new TrayState(o)
	}
	
	toJS() {
		return super.toJS()
	}
	
	open:boolean
	alwaysOnTop:boolean
	autoHide:boolean
}
