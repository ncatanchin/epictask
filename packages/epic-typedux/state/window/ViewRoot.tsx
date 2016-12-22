import { guard, shortId, UIKey, shallowEquals } from "epic-global"
import { getValue, isDefined } from "typeguard"
import { getUIActions } from "epic-typedux/provider"
import { ViewStateEvent, ViewState } from "epic-typedux/state/window/ViewState"
import { List, Map } from "immutable"

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
	stateClazz:IViewStateConstructor = null,
  controllerOpts:any = null
) {
	return (Component:any) => {
		return class ViewRootWrapper extends React.Component<any,any> {
			constructor(props,context) {
				super(props,context)
				
				this.state = {
					ready: false,
					viewStateId: props.viewStateId
				}
			}
			
			getViewState(viewStateId = this.state.viewStateId) {
				return getValue(() => getStoreState().get(UIKey).viewStates.find(it => it.id === this.state.viewStateId))
			}
			
			isReady(props = this.props, viewState = this.getViewState(),viewController = getValue(() => this.state.viewController)) {
				return isDefined(viewController) && isDefined(viewState)
			}
			
			updateState = (props = this.props, viewState:ViewState = null) => {
				let
					{viewController,viewStateId = props.viewStateId} = this.state
				
				if (!viewState)
					viewState = this.getViewState(viewStateId)
				
				const
					isValid = !viewState || viewState instanceof ViewState
				
				if (!isValid && DEBUG)
					debugger
				
				assert(isValid,`View state must be null or Map`)
				
				let
					state = getValue(() => viewState.state)
				
				
				if (stateClazz && (!state || !(state instanceof stateClazz))) {
					state = stateClazz.fromJS(state)
					
					if (viewState) {
						viewState = viewState.set('state', state) as ViewState
						getUIActions().updateView(viewState)
					} else {
						viewStateId = shortId()
						
						getUIActions().createView(new ViewState({
							id: viewStateId,
							state
						}),true)
					}
					
					
				}
				
				
				if (!viewController) {
					viewController = new controllerClazz(viewStateId,state as any,{
						...controllerOpts,
						//storeViewStateProvider: () => getStoreState().get(UIKey).viewStates.find(it => it.id === viewStateId)
						storeViewStateProvider: () => getValue(() => this.state.storeViewState || this.getViewState() || viewState)
					})
					
					// IF NOT VIEW STATE - THEN SUBSCRIBE
					if (viewController.useLocalState) {
						viewController.on(
							ViewStateEvent[ ViewStateEvent.Changed ],
							(updatedState) => setImmediate(() => this.setState({ viewState: updatedState }))
						)
					}
					
				}
				
				
				this.setState({
					viewStateId,
					viewController,
					storeViewState: viewState,
					viewState: getValue(() => viewState.state),
					ready: this.isReady(props,viewState,viewController)
				})
			}
			
			
			componentWillMount() {
				this.setState({
					unsubscribe: getStore().observe([UIKey,'viewStates'],(viewStates:List<ViewState>) => {
						const
							viewStateId = this.state.viewStateId || this.props.viewStateId
						
						if (!viewStateId)
							return
						
						const
							viewState = this.state.storeViewState || this.props.viewState,
							newViewState = viewStates.find(it => it.id === viewStateId)
						
						if (viewState === newViewState)
							return
						
						this.updateState(this.props,newViewState)
					})
				},() => this.updateState())
			}
			
			componentWillReceiveProps(nextProps) {
				this.updateState(nextProps)
			}
			
			componentWillUnmount() {
				guard(() => this.state.unsubscribe())
				this.setState({unsubscribe: null})
			}
			
			// PURE RENDER MANUALLY
			shouldComponentUpdate(nextProps,nextState) {
				return !shallowEquals(this.props,nextProps) ||
						!shallowEquals(this.state,nextState)
			}
			
			render() {
				const
					// viewState = this.getViewState(),
					{ready,viewController,viewStateId,storeViewState} = this.state
				
				if (!ready) {
					return <div />
				}
				
				const
					allProps = {
						...this.props,
						viewController,
						viewState: storeViewState.state,
						viewStateId
					}
				
				return <Component {...allProps} />
			}
			
			
		} as any
		
		
		//
		//
		// return MappedProps(
		// 	(props,mapper) => {
		// 		let
		// 			{viewState,viewStateId} = props,
		// 			viewController:IViewController<any> = getValue(() => mapper.state.viewController)
		//
		//
		// 		let
		// 			state = getValue(() => viewState.state)
		//
		//
		// 		if (stateClazz && (!state || !(state instanceof stateClazz))) {
		// 			state = stateClazz.fromJS(state)
		//
		// 			if (viewState) {
		// 				viewState = viewState.set('state', state)
		// 				getUIActions().updateView(viewState)
		// 			} else {
		// 				viewStateId = shortId()
		// 				viewState = {
		// 					id: viewStateId,
		// 					state,
		// 					name: stateClazz.name,
		// 					type:stateClazz.name
		// 				}
		// 				getUIActions().createView(viewState,true)
		// 			}
		//
		//
		// 		}
		//
		// 		if (!viewController) {
		//
		//
		// 			viewController = new controllerClazz(getValue(() => viewState.id,"0"),state,{...controllerOpts,
		// 				storeViewStateProvider: () => getStoreState().get(UIKey).viewStates.find(it => it.id === viewStateId)
		// 			})
		//
		// 			// IF NOT VIEW STATE - THEN SUBSCRIBE
		// 			viewController.on(
		// 				ViewStateEvent[ ViewStateEvent.Changed ],
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
		// 			storeViewState: viewState,
		// 			viewState: viewController.getState(),
		// 			viewStateId
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


export function OnViewStateChanged(Component) {
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
			if (this.props.viewState) {
				this.setState({
					unsubscribe: getValue(() => this.props.viewController.on(ViewStateEvent.Changed, this.doUpdate))
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
			return <Component ref="instance" {...this.props} viewState={getValue(() => this.props.viewController.getState())} />
		}
	} as any
}

