import { ViewEvent, View, getUIActions, viewsSelector } from "epic-typedux"
import { getValue } from "typeguard"
import { ViewController } from "./ViewController"

export abstract class StoreViewController<S extends Immutable.Map<any,any>> extends ViewController<S> {
	
	private internalState:S
	
	/**
	 * Get view state from redux
	 *
	 * @returns {string}
	 */
	get view():View {
		return getValue(() => viewsSelector(getStoreState()).find(it => it.id === this.id))
	}
	
	/**
	 * state accessor
	 *
	 * @returns {S}
	 */
	get state():S {
		if (this.internalState)
			return this.internalState
		
		return (this.internalState = getValue(() => this.view.state as S, this.initialState))
	}
	
	
	/**
	 * Fire changed event
	 */
	private fireChanged = _.debounce(() => this.emit(ViewEvent[ ViewEvent.Changed ],this.internalState),100)
	
	/**
	 * Push state to store
	 */
	private pushState() {
		const { view } = this
		
		if (view) {
			getUIActions().updateView(view.set('state', this.internalState) as View)
			this.fireChanged()
		}
	}
	
	// pushState = _.debounce(() => {
	// 	const
	// 		{ view } = this
	//
	// 	if (!view)
	// 		return
	//
	// 	getUIActions().updateView(view.set('state', this.internalState) as View)
	//
	// 	this.pushChanged()
	// },100,{
	// 	maxWait: 200
	// })
	
	/**
	 * Set the state
	 *
	 * @param state
	 */
	setState(state:S) {
		this.internalState = state
		this.pushState()
	}
	
	/**
	 * Get the current state
	 *
	 * @returns {S}
	 */
	getState() {
		return this.state
	}
	
	
	constructor(public id:string, private initialState:S, public opts:any = {}) {
		super()
		
	}
}