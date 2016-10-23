import {ILeafReducer} from 'typedux'

const log = getLogger(__filename)


export function getReducers():ILeafReducer<any,any>[] {
	
	// TODO - LOAD FROM SERVICE REGISTRY
	//ctx = require.context('../actions/',true,/Reducer/)
	let ctx = require.context('../actions/',true,/(Reducer\.ts$|Reducer$)/)
	log.info(`Loaded Reducers`,ctx.keys())
	const mods = ctx.keys().map(ctx)

	let reducers = []
	mods.forEach(mod => {
		for (let key of Object.keys(mod)) {
			if (key.indexOf('Reducer') > -1) {
				const
					reducerClazz = mod[key],
					reducer = new reducerClazz()
				if (_.isFunction(reducer.leaf) && !reducers.find(it => it.leaf() === reducer.leaf())) {
					reducers.push(new reducerClazz())
				}
				
			}
		}
	})

	//log.debug('Returning reducers',reducers)
	return reducers
}
