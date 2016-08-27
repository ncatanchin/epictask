/**
 * A counter that can be incremented and decremented
 */
export default class Counter {
	
	/**
	 * Create a new counter, default start value is 0
	 *
	 * @param counterStartValue
	 */
	constructor(private counterStartValue = 0) {
		
	}
	
	/**
	 * Change the counter value by
	 *
	 * @param diff the increment to shift by
	 * @returns {number}
	 */
	private incrementBy(diff:number) {
		this.counterStartValue += diff
		
		return this.counterStartValue
	}
	
	/**
	 * Get the next value +1
	 *
	 * @returns {number}
	 */
	increment() {
		return this.incrementBy(1)
	}
	
	/**
	 * Get the next value -1
	 *
	 * @returns {number}
	 */
	decrement() {
		return this.incrementBy(-1)
	}
}