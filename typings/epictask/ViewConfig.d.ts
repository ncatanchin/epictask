
// namespace LocalImmutable {
// 	import Immutable from 'immutable'
// 	export = Immutable
// }


declare type TComponent<P> = React.ComponentClass<P>

/**
 * React component class
 */
declare type TComponentAny = TComponent<any>

/**
 * Component resolver
 */
declare type TComponentResolver = Promise.Resolver<TComponentAny>

/**
 * Component loader shape
 */
declare type TComponentLoader = (resolver:TComponentResolver) => any


declare type TPromisedComponentLoader = () => Promise<TComponentAny>


//
// /**
//  * View state updater
//  */
// declare interface IViewStateUpdater<S> {
// 	(...arg):(state:S) => S
// }

/**
 * View controller
 */
declare interface IViewController<S> extends NodeJS.EventEmitter {
	
	/**
	 * Get state
	 */
	getState():S
	
	/**
	 * Update the state
	 *
	 * @param newState
	 */
	updateState(patch:{[prop:string]:any}):S
	
	/**
	 * Make a state update function
	 *
	 * @param updater
	 */
	makeStateUpdate<T extends Function>(updater:T):T
	
	useLocalState?:boolean
}


declare interface IViewControllerConstructor<S> {
	new (id:string, initialState?:S, opts?:any):IViewController<S>
}

/**
 * View state constructor
 */
declare interface IViewConstructor extends IModelConstructor<any> {
	new (fromState?:any):IModel
}
