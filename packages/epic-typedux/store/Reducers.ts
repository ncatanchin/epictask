import {ILeafReducer} from 'typedux'

const log = getLogger(__filename)


export function getReducers():ILeafReducer<any,any>[] {
	
	// TODO - LOAD FROM SERVICE REGISTRY
	//ctx = require.context('../actions/',true,/Reducer/)
	// let
	// 	ctx = require.context('../reducers/',true,/(Reducer\.ts$|Reducer$)/)
	//
	
	const
		ctxMod = require('../reducers')
	
	//log.info(`Loaded Reducers`,ctx.keys())
	const mods = Object
		.keys(ctxMod)
		.filter(key => key.indexOf('Reducer') > 0 && _.isFunction(ctxMod[key]))
		.map(key => ctxMod[key])
	
	let
		reducers = []
	
	mods.forEach(mod => {
		const
			reducerClazz = mod,
			reducer = new reducerClazz()
		if (
			_.isFunction(reducer.leaf) &&
			!reducers.find(it => it.leaf() === reducer.leaf())
		) {
			reducers.push(reducer)
		}
	})

	//log.debug('Returning reducers',reducers)
	return reducers
}
