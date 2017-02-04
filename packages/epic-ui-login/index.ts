
import { acceptHot } from "epic-global"
import { makePromisedComponent } from "epic-util"

RouteRegistryScope.Register({
	name: 'Login',
	uri: "pages/login",
	defaultRoute: true,
	authenticated: false,
	title: 'Login',
	provider: makePromisedComponent((resolver:TComponentResolver) =>
		require.ensure([],function(require:any) {
			resolver.resolve(require('./LoginRoot').LoginRoot)
		}))
})
acceptHot(module)