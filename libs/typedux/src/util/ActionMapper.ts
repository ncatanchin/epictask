

import {isRecordObject} from 'typemutant'

/**
 * Create a simple mapped reducer fn
 *
 * @param propertyKey
 * @param args
 * @returns {function(S, M): S}
 */

export function makeMappedReducerFn<S,M>(propertyKey:string,args) {
	return (state:S, message:M):S => {
		let stateFn = state[propertyKey]
		if (!stateFn)
			throw new Error(`Unable to find mapped reduce function on state ${propertyKey}`)

		if (isRecordObject(state)) {
			const newState = state.withMutation(tempState => {
				tempState[propertyKey](...args)
				return tempState
			})

			return  ((newState === (state as any)) ? state : newState) as S

		} else {
			return stateFn(...args)
		}
	}
}