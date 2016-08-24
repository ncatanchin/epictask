
//const log = getLogger(__filename)

/**
 * A reloadable proxy between a target object
 * and the end consumer.
 *
 * Implemented specifically for hot loading
 */
export class VariableProxy<T> {
	private _handler:T

	
	get handler():T {
		return this._handler
	}
	
	get target() {
		return this._target
	}
	
	get targetConstructor() {
		return this._targetConstructor
	}
	
	constructor(private _targetConstructor:{new():T},private _target:T) {
		this._handler = new Proxy({},{
			get: (noopTarget,prop) => {
				return this.target[prop]
			}
		}) as T
	}

	setTargets(targetConstructor,target):this {
		this._targetConstructor = targetConstructor
		this._target = target
		
		return this
	}
}


export default VariableProxy
