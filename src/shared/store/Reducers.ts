import {ILeafReducer} from 'typedux'

const log = getLogger(__filename)
let reducers = null
let ctx = null

export function getReducers():ILeafReducer<any,any>[] {
	if (reducers)
		return reducers

	// TODO - LOAD FROM SERVICE REGISTRY
	ctx = require.context('shared/actions',true,/Reducer\.ts$/)

	const mods = ctx.keys().map(ctx)

	reducers = []
	mods.forEach(mod => {
		for (let key of Object.keys(mod)) {
			if (_.endsWith(key,'Reducer')) {
				const reducerClazz = mod[key]
				reducers.push(new reducerClazz())
			}
		}
	})

	//log.debug('Returning reducers',reducers)
	return reducers
}
