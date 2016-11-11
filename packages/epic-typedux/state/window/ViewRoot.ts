



import { MappedProps } from "epic-global"
import { getValue } from "typeguard"
import { getUIActions } from "epic-typedux/provider"

export function ViewRoot(controllerClazz, stateClazz = null) {
	return (Component:any) => {
		return MappedProps(
			(props,mapper) => {
				let
					{viewState} = props,
					{state} = viewState,
					viewController = getValue(() => mapper.state.viewController)
				
				if (!viewController) {
					if (stateClazz && !(state instanceof stateClazz)) {
						state = stateClazz.fromJS(state)
						viewState = viewState.set('state',state)
						getUIActions().updateView(viewState)
					}
					
					viewController = new controllerClazz(viewState.id,state)
					
					mapper.setState({
						viewController
					})
				}
				
				return {
					viewController
				}
				
				
			}
		)(Component) as any
	}
}