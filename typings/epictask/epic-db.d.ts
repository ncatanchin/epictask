
/**
 * Change shape
 */
declare interface IDatabaseChange {
	type:string
	clazz?:IModelConstructor<any>
	id:string
	rev:string
	doc?:any
	model?:any
	deleted?:boolean
	from?:string
}


/**
 * Change listener shape
 */
declare type TDatabaseChangeListener = (changes:IDatabaseChange[]) => any


