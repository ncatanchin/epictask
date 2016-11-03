

/**
 * Shape of model constructor
 */
declare interface IModelConstructor<T> {
	new (...args:any[]):T
	fromJS(o:any):T
}