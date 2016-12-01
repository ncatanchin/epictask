



declare interface ISelectFieldItem  {
	key: number|string
	value: any
	
	/**
	 * Optional value to use with filtering
	 */
	textContent?:string
	
	style?: any
	
	content: any
	
	/**
	 * Specific text for filtering purposes
	 */
	contentText?: string
	contentStyle?: any
	
	leftAccessory?: any
	leftAccessoryStyle?: any
	
	rightAccessory?: any
	rightAccessoryStyle?: any
}