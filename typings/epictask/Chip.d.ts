

declare interface IChipItem extends IIdObject {
	name?:string
	label?:string
	title?:string
	color?:string
	
	/**
	 * Used for things like avatar url
	 */
	iconImageUrl?:string
	
	/**
	 * Store random stuff
	 */
	data?:any
}


/**
 * Callback for chip item
 */
declare type TChipCallback = (object:IChipItem,event?:any) => void

/**
 * Chip modes
 */
declare type TChipMode = 'normal' | 'dot'