


import { getHot, setDataOnHotDispose } from "epic-global"
import { PureRender } from "epic-ui-components"
export interface IRouteComponentProps<ParamsType> {
	uri?:string
	params?:ParamsType
}



/**
 * Component provider type
 */
export type TComponentProvider<ParamsType> = () =>
	Promise<React.ComponentClass<IRouteComponentProps<ParamsType>>>



const Routes = getHot(module,'routes',{
	
})

setDataOnHotDispose(module,() => ({
	routes: Routes
}))

/**
 * Add route
 *
 * @param path
 * @param provider
 */
export function addRoute<ParamsType>(path:string, provider:TComponentProvider<ParamsType>) {
	
}

/**
 * Route view props
 */
export interface IRouteViewProps {
	
}

/**
 * Route view state
 */
export interface IRouteViewState {
	
}

/**
 * RouteView component
 */
@PureRender
export class RouteView extends React.Component<IRouteViewProps,IRouteViewState> {
	
	/**
	 * Create a new RouteView
	 *
	 * @param props
	 * @param context
	 */
	constructor(props,context) {
		super(props,context)
	}
	
	
	render() {
		return <div />
	}
}