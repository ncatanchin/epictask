

declare interface IChipItem extends IIdObject {
	name?:string
	label?:string
	title?:string
	color?:string
}


/**
 * Callback for chip item
 */
declare type TChipCallback = (object:IChipItem) => void

/**
 * Chip modes
 */
declare type TChipMode = 'normal' | 'dot'