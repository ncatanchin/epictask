
// namespace LocalImmutable {
// 	import Immutable from 'immutable'
// 	export = Immutable
// }




/**
 * React component class
 */
declare type TComponent = React.ComponentClass<any>

/**
 * Component resolver
 */
declare type TComponentResolver = Promise.Resolver<TComponent>

/**
 * Component loader shape
 */
declare type TComponentLoader = (resolver:TComponentResolver) => any


declare type TPromisedComponentLoader = () => Promise<TComponent>


declare interface IViewConfig {
	name:string
	componentLoader:TPromisedComponentLoader
	stateClazz:any
	controllerClazz?:any
	
}
