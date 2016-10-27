



import { PureRender, PromisedComponent } from "epic-ui-components/common"
import { TRouteMap, IRouteURIProvider, IRouteInstance, Router } from "./Router"
import { WindowHashURIProvider } from "epic-entry-ui/routes/WindowHashURIProvider"
import { RouterEvent } from "./Router"
import { TRouteComponent } from "epic-entry-ui/routes"




/**
 * Route view props
 */
export interface IRouteViewProps {
	routerId:string
	routes:TRouteMap
	uriProvider?:IRouteURIProvider
}

/**
 * Route view state
 */
export interface IRouteViewState {
	uriProvider?:IRouteURIProvider
	route?:IRouteInstance<any>
	router?:Router
	promise?:Promise<TRouteComponent<any>>
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
		
		let
			{routerId,uriProvider,routes} = props
		
		uriProvider = uriProvider || new WindowHashURIProvider()
		
		const
			router = Router
				.get(routerId)
				.addRoutes(routes)
				.setURIProvider(uriProvider)
				
		const
			route = router.getRoute()
		
		this.state = {
			router,
			route,
			uriProvider,
			promise: route && route.provider()
		}
	}
	
	
	private updateRoute = (route:IRouteInstance<any>) => {
		if (route === this.state.route)
			return
		
		this.setState({
			route,
			promise: route && route.provider()
		})
	}
	
	/**
	 * On a route change
	 *
	 * @param event
	 * @param route
	 */
	private onRouteChanged = (event,route:IRouteInstance<any>) => {
		this.setState({route})
	}
	
	/**
	 * On mount add listener
	 */
	componentWillMount() {
		const
			{router,route} = this.state
		
		router.addListener(RouterEvent.RouteChanged,this.onRouteChanged)
		
		// UPDATE THE ROUTE IF REQUIRED
		if (router.getRoute() !== route)
			this.updateRoute(route)
			
	}
	
	/**
	 * On unmount remove listener
	 */
	componentWillUnmount() {
		const
			{router} = this.state
		
		router.removeListener(RouterEvent.RouteChanged,this.onRouteChanged)
	}
	
	render() {
		const
			{promise} = this.state
		
		return !promise ?
			React.DOM.noscript() :
			<PromisedComponent promise={promise} />
	}
}