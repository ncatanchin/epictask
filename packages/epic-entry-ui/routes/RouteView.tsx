



import { PureRender, PromisedComponent } from "epic-ui-components/common"
import { IRouteURIProvider, IRouteInstance, Router } from "./Router"
import { WindowHashURIProvider } from "epic-entry-ui/routes/WindowHashURIProvider"
import { RouterEvent } from "./Router"
import { TRouteComponent, TRouteChangeListener, IRoute } from "epic-entry-ui/routes"
import { getValue } from "epic-global"
import { guard } from "typeguard"
import * as React from "react"


const
	log = getLogger(__filename)

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
		
		log.info(`Setting route`,route)
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
	
	private updateRoute = (route:IRouteInstance<any>, force = false) => {
		if (route === this.state.route && !force)
			return
		
		log.debug(`Setting route`,route)
		
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
	
	private onStatusUpdate = status => {
		if (status === "apply") {
			log.debug(`Webpack HMR Status Change: ${status}`, this.state.route)
			//this.forceUpdate()
			if (this.state.route) {
				Promise.delay(100).then(() =>
				this.updateRoute(this.state.route, true))
			}
		}
	}
	
	
	private removeListener = () => guard(() => module.hot.removeStatusHandler(this.onStatusUpdate))
	
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
		
		if (module.hot) {
			module.hot.status(this.onStatusUpdate)
			guard(() => window.addEventListener('unload',this.removeListener))
			
		}
	}
	
	
	
	/**
	 * On unmount remove listener
	 */
	componentWillUnmount() {
		const
			{router} = this.state
		
		router.removeListener(RouterEvent.RouteChanged,this.onRouteChanged)
		
		if (module.hot) {
			this.removeListener()
		}
		
		
	}
	
	componentWillReceiveProps(nextProps) {
		if (nextProps.routes !== this.props.routes) {
			this.state.router.reloadRoutes(nextProps.routes)
		}
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