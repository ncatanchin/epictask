
const log = getLogger(__filename)

export type OnValueChanged = (newValue,oldValue) => any

export default class ValueCache {

	private value:any

	constructor(private onValueChanged:OnValueChanged) {
		assert(onValueChanged,'An onValueChanged handler is required')
	}

	set(newValue:any) {
		if (newValue === this.value || _.isEqual(newValue,this.value)) {
			log.debug('no change')
			return false
		} else {
			const oldValue = this.value
			this.value = newValue
			return this.onValueChanged(newValue,oldValue)
		}
	}
}