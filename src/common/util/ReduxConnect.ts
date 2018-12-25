/**
 * Redux connect with type support
 *
 * @param selector
 * @returns {(target: any) => any}
 * @param opts
 */
import {connect as origConnect} from "react-redux"


/**
 * A typed component
 */
export interface IReactComponentConstructor<P,S> {
	new(props?:P,context?:any):React.Component<P,S>
}


export function connect<P,S>(selector:any, opts:any = {}):(target:IReactComponentConstructor<P,S>) => void {
	return (target) => origConnect(selector,opts)(target as any) as any
}
