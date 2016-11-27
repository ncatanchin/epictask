



import { MappedProps } from "epic-global"
import { getValue } from "typeguard"
import { getUIActions } from "epic-typedux/provider"
import { ViewStateEvent } from "epic-typedux/state/window/ViewState"

/**
 * View root HOC
 *
 * @param controllerClazz
 * @param stateClazz
 * @returns {(Component:any)=>any}
 * @constructor
 */
export function ViewRoot<S,VC extends IViewControllerConstructor<S>>(
	controllerClazz:VC,
	stateClazz:IViewStateConstructor = null
) {
	return (Component:any) => {
		return MappedProps(
			(props,mapper) => {
				let
					viewState = props.viewState,
					viewController:IViewController<any> = getValue(() => mapper.state.viewController)
				
				if (!viewController) {
					let
						state = getValue(() => viewState.state)
					
					
					if (stateClazz && (!state || !(state instanceof stateClazz))) {
						state = stateClazz.fromJS(state)
						
						if (viewState) {
							viewState = viewState.set('state', state)
							getUIActions().updateView(viewState)
						}
					}
					
					viewController = new controllerClazz(getValue(() => viewState.id,"0"),state)
						
					// IF NOT VIEW STATE - THEN SUBSCRIBE
					if (!viewState) {
						viewController.on(
							ViewStateEvent[ ViewStateEvent.Changed ],
							(updatedState) => mapper.remap()
						)
					}
					
					mapper.setState({
						viewController
					})
					
				}
				
				return {
					viewController,
					viewState: viewController.getState()
				}
			},
			{
				// onMount(mapper,props,data) {
				//
				// 	// CREATE VIEW STATE IF NEEDED
				//
				// },
				// onUnmount(mapper,props,data) {
				//
				// 	// IF CREATED VIEW STATE THEN DELETE IT
				// },
				
				onRender(mapper,defaultRender,props,data) {
					
					let
						viewController:IViewController<any> = getValue(() => mapper.state.viewController)
					
					// IMPLEMENT LOAD IF VIEW STATE NOT READY
					if (!viewController)
						return React.DOM.noscript()
					
					return defaultRender()
				}
			}
		)(Component) as any
	}
}