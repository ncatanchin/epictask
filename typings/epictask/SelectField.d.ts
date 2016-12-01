



declare interface ISelectFieldItem  {
	key: number|string
	value: any
	
	/**
	 * Optional value to use with filtering
	 */
	textContent?:string
	
	style?: any
	
	content: any
	contentStyle?: any
	
	leftAccessory?: any
	leftAccessoryStyle?: any
	
	rightAccessory?: any
	rightAccessoryStyle?: any
}