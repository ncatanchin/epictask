
const log = getLogger(__filename)

export type OnValueChanged = (newValue,oldValue) => any

/**
 * Creates a value cache, when changed
 * the onValueChange listener is triggered
 */
export default class ValueCache {

	private value:any
	
	/**
	 * New value cache
	 *
	 * @param onValueChanged
	 * @param shallow - use === - defaults to false
	 * @param initialValue
	 */
	constructor(
		private onValueChanged:OnValueChanged,
		private shallow:boolean = false,
		initialValue = null
	) {
		assert(onValueChanged,'An onValueChanged handler is required')
		
		this.value = initialValue
	}

	set(newValue:any) {
		if ((this.shallow && newValue === this.value) || (!this.shallow && _.isEqual(newValue,this.value))) {
			log.debug('no change')
			return false
		} else {
			const oldValue = this.value
			this.value = newValue
			return this.onValueChanged(newValue,oldValue)
		}
	}
	
	get() {
		return this.value
	}
}