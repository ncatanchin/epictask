//import * as Immutable from 'immutable'



/**
 * Store State
 */
export interface StateConstructor<T> {
	new():T
	new(o:any):T
}

//export interface State extends Immutable.Map<string,any> {
export interface State {

}