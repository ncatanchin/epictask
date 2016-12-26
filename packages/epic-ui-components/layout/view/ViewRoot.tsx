import { guard, shortId, UIKey, shallowEquals } from "epic-global"
import { getValue, isDefined, isFunction } from "typeguard"
import { getUIActions } from "epic-typedux/provider"
import { ViewEvent, View } from "epic-typedux/state/window/View"
import { List, Map } from "immutable"
import { uiStateSelector } from "epic-typedux/selectors"

const
	log = getLogger(__filename)

//log.setOverrideLevel(LogLevel.DEBUG)

declare global {
	
	/**
	 * Default props for a root
	 */
	interface IViewRootProps<VC,VS> {
		viewController?:VC
		viewState?:VS
		view?:View
		viewId?:string
	}
}


/**
 * View root HOC
 *
 * @param controllerClazz
 * @param stateClazz
 * @param controllerOpts
 * @returns {(Component:any)=>any}
 * @constructor
 */
export function ViewRoot<S,VC extends IViewControllerConstructor<S>>(
	controllerClazz:VC,
	stateClazz:IViewConstructor = null,
  controllerOpts:any = null
) {
	return (Component:any) => {
		return class ViewRootWrapper extends React.Component<any,any> {
			constructor(props,context) {
				super(props,context)
				
				this.state = {
					ready: false,
					viewId: props.viewId
				}
			}
			
			/**
			 * Get the view id - this is critical
			 *
			 * @param props
			 * @returns {any}
			 */
			getViewId(props = this.props) {
				let
					{viewId = props.viewId} = this.state
				
				if (!viewId) {
					viewId = shortId()
				}
				
				if (!this.state.viewId) {
					this.setState({viewId})
				}
				
				return viewId
			}
			
			/**
			 * Get the view
			 *
			 * @returns {View}
			 */
			getView() {
				const
					viewId = this.getViewId()
				
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
			 * Ready to render ??
			 *
			 * @param props
			 * @param view
			 * @param viewController
			 * @returns {boolean}
			 */
			isReady(props = this.props, view = this.getView(), viewController = getValue(() => this.state.viewController)) {
				return isDefined(viewController) && isDefined(view)
			}
			
			/**
			 * Update the state
			 *
			 * @param props
			 * @param view
			 */
			updateState = (props = this.props, view:View = null) => {
				// GRAB VIEW IF MISSING
				view = view || this.getView()
				
				
				const
					viewId = this.getViewId(),
					isValid = !view || view instanceof View
				
				assert(isValid,`View state must be null or Map`)
				
				let
					{viewController} = this.state,
					state = getValue(() => view.state)
				
				// if (state && state.toJS)
				// 	state = state.toJS()
				
				if (stateClazz && (!state || !(state instanceof stateClazz))) {
					state = stateClazz.fromJS(isFunction(getValue(() => state.toJS)) ? state.toJS() : state)
					
					if (view) {
						view = view.set('state', state) as View
						getUIActions().updateView(view)
						
						// RETURNING HERE IS MEGA IMPORTANT
						return
					} else {
						getUIActions().createView(new View({
							id: viewId,
							state
						}),true)
					}
				}
				
				
				if (!viewController) {
					viewController = new controllerClazz(viewId,state as any,{
						...controllerOpts,
						//storeViewProvider: () => getStoreState().get(UIKey).views.find(it => it.id === viewId)
						storeViewProvider: () => getValue(() => this.state.view || this.getView() || view)
					})
					
				}
				
				
				this.setState({
					viewController,
					view,
					viewState: getValue(() => view.state),
					ready: this.isReady(props,view,viewController)
				})
			}
			
			/**
			 * On mount assemble the view
			 */
			componentWillMount() {
				this.setState({
					unsubscribe: getStore().observe([UIKey,'views'],(views:List<View>) => {
						const
							viewId = this.state.viewId || this.props.viewId
						
						if (!viewId)
							return
						
						const
							view = this.state.storeView || this.props.view,
							newView = views.find(it => it.id === viewId)
						
						if (view === newView)
							return
						
						this.updateState(this.props,newView)
					})
				},() => this.updateState())
			}
			
			
			/**
			 * On new props - double check the state, not much should change
			 *
			 * @param nextProps
			 */
			componentWillReceiveProps(nextProps) {
				this.updateState(nextProps)
			}
			
			/**
			 * On unmount, if a temp view then delete from then state
			 */
			componentWillUnmount() {
				
				guard(() => this.state.unsubscribe())
				
				const view = this.getView()
				
				if (view && view.temp)
					getUIActions().removeView(view.id)
				
				this.setState({
					unsubscribe: null
				})
			}
			
			// PURE RENDER MANUALLY
			shouldComponentUpdate(nextProps,nextState) {
				return !shallowEquals(this.props,nextProps) ||
						!shallowEquals(this.state,nextState)
			}
			
			render() {
				const
					// view = this.getView(),
					{ready,view,viewController,viewId,viewState} = this.state
				
				if (!ready) {
					return <div />
				}
				
				const
					allProps = {
						...this.props,
						viewController,
						view,
						viewState,
						viewId
					}
				
				return <Component {...allProps} />
			}
			
			
		} as any
		
		
		//
		//
		// return MappedProps(
		// 	(props,mapper) => {
		// 		let
		// 			{view,viewId} = props,
		// 			viewController:IViewController<any> = getValue(() => mapper.state.viewController)
		//
		//
		// 		let
		// 			state = getValue(() => view.state)
		//
		//
		// 		if (stateClazz && (!state || !(state instanceof stateClazz))) {
		// 			state = stateClazz.fromJS(state)
		//
		// 			if (view) {
		// 				view = view.set('state', state)
		// 				getUIActions().updateView(view)
		// 			} else {
		// 				viewId = shortId()
		// 				view = {
		// 					id: viewId,
		// 					state,
		// 					name: stateClazz.name,
		// 					type:stateClazz.name
		// 				}
		// 				getUIActions().createView(view,true)
		// 			}
		//
		//
		// 		}
		//
		// 		if (!viewController) {
		//
		//
		// 			viewController = new controllerClazz(getValue(() => view.id,"0"),state,{...controllerOpts,
		// 				storeViewProvider: () => getStoreState().get(UIKey).views.find(it => it.id === viewId)
		// 			})
		//
		// 			// IF NOT VIEW STATE - THEN SUBSCRIBE
		// 			viewController.on(
		// 				ViewEvent[ ViewEvent.Changed ],
		// 				(updatedState) => setImmediate(() => mapper.remap())
		// 			)
		//
		// 			mapper.setState({
		// 				viewController
		// 			})
		//
		// 		}
		//
		// 		return {
		// 			viewController,
		// 			storeView: view,
		// 			view: viewController.getState(),
		// 			viewId
		// 		}
		// 	},
		// 	{
		// 		// onMount(mapper,props,data) {
		// 		//
		// 		// 	// CREATE VIEW STATE IF NEEDED
		// 		//
		// 		// },
		// 		// onUnmount(mapper,props,data) {
		// 		//
		// 		// 	// IF CREATED VIEW STATE THEN DELETE IT
		// 		// },
		//
		// 		onRender(mapper,defaultRender,props,data) {
		//
		// 			let
		// 				viewController:IViewController<any> = getValue(() => mapper.state.viewController)
		//
		// 			// IMPLEMENT LOAD IF VIEW STATE NOT READY
		// 			if (!viewController)
		// 				return React.DOM.noscript()
		//
		// 			return defaultRender()
		// 		}
		// 	}
		// )(Component) as any
	}
}


export function OnViewChanged(Component) {
	return class extends React.Component<any,any> {
		
		refs:any
		
		constructor(props,context) {
			super(props,context)
			this.state = {}
		}
		
		doUpdate = () => {
			this.forceUpdate()
		}
		
		getWrappedInstance() {
			return getValue(() => this.refs.instance)
		}
		
		componentWillMount() {
			if (this.props.view) {
				this.setState({
					unsubscribe: getValue(() => this.props.viewController.on(ViewEvent.Changed, this.doUpdate))
				})
			}
		}
		
		componentWillUnmount() {
			guard(() => this.state.unsubscribe())
			this.setState({
				unsubscribe: null
			})
		}
		
		render() {
			return <Component ref="instance" {...this.props} view={getValue(() => this.props.viewController.getState())} />
		}
	} as any
}

