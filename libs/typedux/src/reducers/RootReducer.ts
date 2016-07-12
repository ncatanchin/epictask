import {getLogger} from 'typelogger'
import {Reducer as ReduxReducer,Action as ReduxAction} from 'redux'
import * as Immutable from 'immutable'
import {State} from './State'
import {getAction,ActionMessage} from "../actions"
import {ILeafReducer} from './LeafReducer'
import {makeMappedReducerFn} from '../util/ActionMapper'
import {isFunction} from '../util/index'
import {getStoreStateProvider} from '../actions/Actions'


const log = getLogger(__filename)

/**
 * Ensure the state we get back is still
 * an Immutable.Map
 *
 * @param state
 * @returns {boolean}
 * @param rootStateType
 */
function stateTypeGuard(state:any,rootStateType = null):state is State {
	return (state instanceof Immutable.Map && (rootStateType == null || state instanceof rootStateType))
}


/**
 * Error handler type for root reducer
 */
export type RootReducerErrorHandler = (err:Error,reducer?:ILeafReducer<any,any>) => void

export class RootReducer<S extends State> {

	private reducers:ILeafReducer<any,ActionMessage<any>>[] = []

	public onError:RootReducerErrorHandler

	constructor(private rootStateType:{new():S} = null,...reducers:ILeafReducer<any,any>[]) {
		this.reducers.push(...reducers)
	}


	defaultState(defaultStateValue:any = null):S {
		let state = this.rootStateType ? new (this.rootStateType as any)(defaultStateValue || {}) :
			Immutable.Map<string,any>(defaultStateValue || {})

		assert(Immutable.Map.isMap(state) || state instanceof Immutable.Record,
			'Even custom rootStateTypes MUST extends ImmutableJS record or map')


		this.reducers.forEach((reducer) => {


			const leafDefaultStateValue = defaultStateValue && defaultStateValue[reducer.leaf()]
			const leafDefaultState = reducer.defaultState(leafDefaultStateValue || {})
			// if (leafDefaultState.set && leafDefaultStateValue) {
			// 	Object.keys(leafDefaultStateValue)
			// 		.forEach(key => leafDefaultState.set(key,leafDefaultStateValue[key]))
			// }
			state = state.set(reducer.leaf(), leafDefaultState)
		})



		return state as any
	}

	makeGenericHandler():ReduxReducer<S> {
		return (state:S,action:ReduxAction):S => {
			return this.handle(state,action as ActionMessage<any>) as S
		}
	}

	handle(state:State,action:ActionMessage<any>):S {
		try {
			let hasChanged = false


			if (!state || !stateTypeGuard(state)) {
				state = this.defaultState()
				hasChanged = true
			}

			let nextState = state.withMutations((tempState) => {
				for (let reducer of this.reducers) {
					const leaf = reducer.leaf()
					if (action.leaf && action.leaf !== leaf)
						continue

					const actionReg = getAction(leaf,action.type)

					// Get Current RAW state
					const rawLeafState = tempState.get(leaf)

					// Shape it for the reducer
					const startReducerState = reducer.prepareState(rawLeafState)

					let reducerState = startReducerState
					let stateChangeDetected = false

					try {
						log.debug('Action type supported', leaf, action.type)

						/**
						 * Check the returned state from every handler for changes
						 *
						 * @param newReducerState
						 */
						function checkReducerStateChange(newReducerState) {
							if (!newReducerState)
								throw new Error(`New reducer state is null for leaf ${leaf}`)


							stateChangeDetected = stateChangeDetected || reducerState !== newReducerState
							reducerState = newReducerState
							//log.debug("State change detected",stateChangeDetected)
						}

						// First check the reducer itself
						checkReducerStateChange((reducer.handle) ?
							reducer.handle(reducerState, action) :
							reducerState)

						// Now iterate the reducers on the message
						if (action.reducers && action.reducers.length) {
							action.reducers.forEach((actionReducer) => {
								if (action.stateType && reducerState instanceof action.stateType)
									checkReducerStateChange(actionReducer(reducerState, action))
							})
						}

						if (actionReg && actionReg.options.isReducer) {
							const reducerFn = actionReg.action(null,...action.args)
							if (!reducerFn || !isFunction(reducerFn))
								throw new Error(`Action reducer did not return a function: ${actionReg.type}`)

							log.info('Calling action reducer: ',actionReg.type)
							checkReducerStateChange(reducerFn(reducerState,getStoreStateProvider()))
						}

						if (isFunction(reducer[action.type])) {
							checkReducerStateChange(reducer[action.type](reducerState,...action.args))
						}
						//NOTE: Removed in favor of new @ActionReducer
						// else if (isFunction(reducerState[action.type])) {
						// 	log.debug('Called reducer directly on state function',action.type)
						// 	const reducerFn = makeMappedReducerFn(action.type,action.args)
						// 	checkReducerStateChange(reducerFn(reducerState,action))
						//
						// 	// const
						// 	// log.debug('Creating mapped handler', propertyKey)
						// 	// finalReducers = [makeMappedReducerFn<S,M>(propertyKey,args)]
						// }

					} catch (err) {
						log.error(`Error occurred on reducer leaf ${leaf}`, err)
						if (reducer.handleError) {
							reducer.handleError(startReducerState, action, err)
						}

						this.onError && this.onError(err,reducer)
					}

					if (stateChangeDetected) {
						tempState.set(leaf, reducerState)
						hasChanged = true
					}
				}
			})

			log.debug('Has changed after all reducers', hasChanged, 'states equal', nextState === state)
			return (hasChanged ? nextState : state) as S

		} catch (err) {
			log.error('Error bubbled to root reducer',err)

			// If error handler exists then use it
			if (this.onError) {
				this.onError && this.onError(err)
				return state as S
			}

			// Otherwise throw
			throw err
		}
	}
}

export default RootReducer

// export default (state:any,action:any):any => {
// 	return rootReducer.handle(state as DefaultStateType, action as ActionMessage<any>)
// }
