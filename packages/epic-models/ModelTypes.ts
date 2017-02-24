import {IModel as TSIModel, Repo as TSRepo} from 'typestore'


declare global {
	
	interface IModel {
		toJS?:() => any
		clazzType?:string;
	}
	
	
	/**
	 * Shape of model constructor
	 */
	
	interface IModelConstructor<T> {
		new <T extends IModel>(...args:any[]):T
		fromJS(o:any):T
		
	}
	
	
	interface IModelStoreConstructor<T extends TSIModel,TR extends TSRepo<T>> {
		new ():TR
	}
}

export {
	
}