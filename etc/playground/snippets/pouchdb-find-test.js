//require('babel-polyfill')
let PouchDB = require('pouchdb').plugin(require('pouchdb-find'))

async function doTest() {
	//let db = new PouchDB('/tmp/testdb-find')
	console.log('create db')
	// let db = new PouchDB('http://127.0.0.1:5984/epictask-development-2')
	//let db = new PouchDB('/Users/jglanz/Library/Application Support/Electron/epictask-development-2.db')



	console.log('open db')
	//await db.open()

	console.log('query')
	// const results = await db.allDocs({
	// 	include_docs:false,
	// 	keys: [
	// 		'100432290',
	// 		'fasvcasdcads'
	// 	]
	// })
	const results = await db.find({
		"selector": {
			"type": {
				"$eq": "Issue"
			},
			"$or": [
				{
					"attrs.repoId": {
						"$eq": 36535156
					}
				},
				{
					"attrs.repoId": {
						"$eq": 58922079
					}
				}
			]
		},
		"fields": [
			"attrs.id"
		]
	})

	console.log('results',JSON.stringify(results,null,4))


	// console.log('Adding docs')
	// await db.bulkDocs([{_id:1,type:'cool'},{_id:2,type:'cool'},{_id:3,type:'notcool'}])
	// const createResult = db.createIndex({index:{fields:['type']}})
	//
	// 		console.log('Created index',createResult)
	// 	const findResult = await db.find({
	// 			selector: {
	// 				type: 'cool',
	// 				limit: 1
	// 			}
	// 		})
	// 		console.log('Find result', findResult)

}


doTest()