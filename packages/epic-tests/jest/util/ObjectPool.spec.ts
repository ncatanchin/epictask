
import '../TestJestSetup'
import { Pool, IPoolResourceFactory } from 'epic-global/ObjectPool'
import {List} from 'immutable'
import { isString } from "typeguard"



const
	factory = {
		create() {
			return Promise.resolve('hello')
		},
		destroy(str) {
			return Promise.resolve()
		},
		validate(str) {
			return Promise.resolve(isString(str))
		}
	} as IPoolResourceFactory<string>

test(`Create pool`,async () => {
	
	const
		pool = new Pool(factory)
	
	expect(await pool.acquire()).toBe('hello')
	
})

test(`Acquire more than max`,async () => {
	
	const
		pool = new Pool(factory,{limit: 1}),
		val1 = await pool.acquire()
	
	expect(val1).toBe('hello')
	
	let
		error = null
	
	try {
		await pool.acquire()
	} catch (err) {
		error  = err
	}
	expect(error).toBeTruthy()
	expect(error.name).toBe('AssertionError')
	
	await pool.release(val1)
	
	const
		val2 = await pool.acquire()
	expect(val2).toBe('hello')
	
	
	return true
	
})
