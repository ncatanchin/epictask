

import { SimpleEventEmitter } from "epic-global/SimpleEventEmitter"
const
	log = getLogger(__filename)

export default class JobMonitorController extends SimpleEventEmitter<(selectedId:string,selectedLogId:string) => any> {
	
	selectedId:string
	
	selectedLogId:string
	
	/**
	 * On change emit
	 */
	private changed() {
		this.emit(this.selectedId,this.selectedLogId)
	}
	
	
	/**
	 * Create the controller
	 */
	constructor() {
		super()
	}
	
	
	
	
	/**
	 * Set the selected id
	 *
	 * @param selectedId
	 */
	setSelectedId(selectedId:string) {
		this.selectedId = selectedId
		this.changed()
	}
	
	
	/**
	 * The selected log id
	 *
	 * @param selectedLogId
	 */
	setSelectedLogId(selectedLogId:string) {
		this.selectedLogId = selectedLogId
		this.changed()
	}
	
}