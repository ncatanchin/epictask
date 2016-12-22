import {EventEmitter} from 'events'
import { cloneObjectShallow } from "epic-global"
import { getValue } from "typeguard"
import { ViewStateEvent } from "./ViewState"


const
	log = getLogger(__filename)

export abstract class ViewController<S extends Immutable.Map<any,any>> extends EventEmitter implements IViewController<S> {
	
	/**
	 * Set the state
	 *
	 * @param state
	 */
	abstract setState(state:S)
	
	/**
	 * Get the view state
	 *
	 * @returns {IssueTrayState}
	 */
	abstract getState():S
	
	
	/**
	 * Patch the view state
	 *
	 * @param patch
	 * @returns {IssueTrayState}
	 */
	updateState(patch:{ [p:string]:any }):S {
		patch = cloneObjectShallow(patch)
		
		const
			keys = getValue(() => Object.keys(patch)),
			startState = this.getState()
		
		let
			state = startState
		
		if (!patch || !keys || !keys.length)
			return state
		
		const
			updatedState = state.withMutations(newState => {
				for (let key of keys) {
					const
						newVal = patch[ key ]
					
					if (newState.get(key) !== newVal)
						newState = newState.set(key, newVal)
				}
				
				return newState
			}) as S
		
		if (updatedState !== startState) {
			this.setState(updatedState)
			this.emit(ViewStateEvent[ ViewStateEvent.Changed ],updatedState)
		}
		
		return updatedState
	}
	
	/**
	 * Make state updater
	 *
	 * @param updater
	 */
	makeStateUpdate<T extends Function>(updater:T):T {
		return ((...args) => {
			
			const
				stateUpdater = updater(...args),
				startState = this.getState(),
				updatedState = stateUpdater(startState) as S
			
			if (updatedState === startState) {
				log.debug(`No state update`, args)
				return startState
			}
			
			this.setState(updatedState)
			
			return updatedState
			
		}) as any
	}
}