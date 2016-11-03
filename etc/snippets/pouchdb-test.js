const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))
const openDB = () => new PouchDB('/tmp/testdb-mancy3')
openDB()
	.then(db => {
		return db.destroy()
	})
	.then(() => {
		return openDB()
	})
	.then(db => {
		return db.getIndexes()
			.then(indexes => {
				console.log('got indexes',indexes)
			})
			.then(() => Promise.resolve(db))
	})
	.catch(err => {
		console.error('error occurred',err)
	})