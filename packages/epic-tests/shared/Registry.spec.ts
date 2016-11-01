//
//
//
// import {RegisterModel} from "epic-global"
//
// describe('Registry',() => {
// 	describe('Decorations',() => {
// 		it('Adds $$clazz to the object in the constructor',() => {
//
// 			@RegisterModel
// 			class ModelTest {
//
// 				static fromJS = (o) => new ModelTest(o)
//
// 				constructor(arg1) {
// 					console.log('got arg1',arg1)
// 					expect(arg1).toBe('test1')
// 				}
// 			}
//
// 			const model = new ModelTest('test1') as any
// 			expect(model.$$clazz).toBe('ModelTest')
// 		})
// 	})
// })

test(`${__filename} Empty`,() => expect(1).toBe(1))