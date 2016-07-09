//require('babel-polyfill')
let PouchDB = require('pouchdb').plugin(require('pouchdb-find'))

async function doTest() {
	let db = new PouchDB('/tmp/testdb-find')

	await db.open()
	console.log('Adding docs')
	await db.bulkDocs([{_id:1,type:'cool'},{_id:2,type:'cool'},{_id:3,type:'notcool'}])
	const createResult = db.createIndex({index:{fields:['type']}})

			console.log('Created index',createResult)
		const findResult = await db.find({
				selector: {
					type: 'cool',
					limit: 1
				}
			})
			console.log('Find result', findResult)



}


doTest()