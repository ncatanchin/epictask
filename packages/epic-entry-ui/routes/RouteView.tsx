



import { PureRender, PromisedComponent } from "epic-ui-components/common"
import { TRouteMap, IRouteURIProvider, IRouteInstance, Router } from "./Router"
import { WindowHashURIProvider } from "epic-entry-ui/routes/WindowHashURIProvider"
import { RouterEvent } from "./Router"
import { TRouteComponent, TRouteChangeListener, IRoute } from "epic-entry-ui/routes"
import { getValue } from "epic-global"




/**
 * Route view props
 */
export interface IRouteViewProps {
	routerId:string
	routes:TRouteMap
	onRouteChange?: (event:RouterEvent,router:Router,route:IRouteInstance<any>) => any
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
			{onRouteChange,routerId,uriProvider,routes} = props
		
		uriProvider = uriProvider || new WindowHashURIProvider()
		
		const
			router = Router
				.get(routerId)
				.addRoutes(routes)
				
		if (onRouteChange)
			router.addListener(RouterEvent.RouteChanged,onRouteChange)
		
		router.setURIProvider(uriProvider)
		
		const
			route = router.getRoute()
		
		this.state = {
			router,
			route,
			uriProvider,
			promise: route && route.provider()
		}
	}
	
	
	getRouter() {
		return getValue(() => this.state.router)
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
	 * @param router
	 * @param route
	 */
	private onRouteChanged = (event:RouterEvent,router:Router,route:IRouteInstance<any>) => {
		this.updateRoute(route)
	}
	
	/**
	 * On mount add listener
	 */
	componentWillMount() {
		const
			{router,route} = this.state
		
		router.addListener(RouterEvent.RouteChanged,this.onRouteChanged)
		
		// UPDATE THE ROUTE IF REQUIRED
		//if (router.getRoute() !== route)
		this.updateRoute(router.getRoute())
			
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
			{promise,route} = this.state,
			{uri,params} = route || {} as any,
			componentProps = {
				uri,
				params
			}
		
		return !promise ?
			React.DOM.noscript() :
			<PromisedComponent promise={promise} componentProps={componentProps} />
	}
}