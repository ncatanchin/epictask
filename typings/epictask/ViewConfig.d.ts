
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


declare interface IViewConfig {
	name:string
	type:string
}
