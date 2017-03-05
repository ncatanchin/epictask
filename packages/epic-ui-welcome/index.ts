
import { makePromisedComponent } from "epic-util"
import { acceptHot } from "epic-global"

RouteRegistryScope.Register({
	name: 'Welcome',
	uri: "welcome",
	title: 'Welcome',
	provider: makePromisedComponent((resolver:TComponentResolver) =>
		require.ensure([],function(require:any) {
			resolver.resolve(require('./WelcomeRoot').WelcomeRoot)
		}))
})


acceptHot(module)