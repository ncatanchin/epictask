import { ViewEvent, View, getUIActions, viewsSelector } from "epic-typedux"
import { getValue } from "typeguard"
import { ViewController } from "./ViewController"
import { uiStateSelector } from "epic-typedux/selectors"

const
	log = getLogger(__filename)

export abstract class StoreViewController<S extends Immutable.Map<any,any>> extends ViewController<S> {
	
	private internalState:S
	
	private newTitle = null
	
	/**
	 * Get the view
	 *
	 * @returns {View}
	 */
	getView() {
		const
			viewId = this.id
		
		for (let viewType of ['views','tabViews']) {
			const
				views = uiStateSelector(getStoreState())[viewType],
				view = getValue(() => views.find(it => it.id === viewId))
			
			log.debug(`looking for view`,viewId,`in ${viewType}`,views,`found`,view)
			
			if (view)
				return view
		}
		
		return null
	}
	
	/**
	 * Get view state from redux
	 *
	 * @returns {string}
	 */
	get view():View {
		return this.getView()
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
		let { view } = this
		
		if (view) {
			view = view.set('state', this.internalState) as View
			
			// UPDATE TITLE IF SET
			if (this.newTitle) {
				view = view.set('title',this.newTitle) as View
				this.newTitle = null
			}
			
			getUIActions().updateView(view)
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
	
	/**
	 * Set name
	 *
	 * @param name
	 */
	setViewName(name:string) {
		const
			view = this.getView()
		
		if (!view)
			return
		
		getUIActions().updateView(view.merge({name}))
	}
	
	
	/**
	 * Set title
	 *
	 * @param title
	 */
	setViewTitle(title:string) {
		this.newTitle = title
		this.pushState()
	}
	
	constructor(public id:string, private initialState:S, public opts:any = {}) {
		super()
		
	}
}