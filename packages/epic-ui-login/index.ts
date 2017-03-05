
import { acceptHot } from "epic-global"
import { makePromisedComponent } from "epic-util"

const
	log = getLogger(__filename)

log.info(`Loading epic login module`)

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

acceptHot(module,log)