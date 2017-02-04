

declare interface IModel {
	toJS?:() => any
	clazzType?: string;
}


/**
 * Shape of model constructor
 */
declare interface IModelConstructor<T> {
	new <T extends IModel>(...args:any[]):T
	fromJS(o:any):T
	
}





