// import * as lunr from 'lunr'
import {ModelPersistenceEventType} from 'typestore'
import {getUserDataFilename, readFile, writeFile, readJSONFile, writeJSONFile} from './util/Files'



const
	lunr = require('lunr'),
	log = getLogger(__filename)

export interface ILunrSchema<M> {
	ref:string
	fields:{[field:string]:number}
	normalizer?:(model:M) => any
}

export const AllLunrIndexes= []

export class LunrIndex<M> {

	static async persistAll() {
		log.info(`Persisting all indexes`)
		const allPromises = AllLunrIndexes.map(idx => idx.persist())
		await Promise.all(allPromises)
		log.info(`Persisted all indexes`)
	}

	private idxFile
	private idx
	private dirty = false

	constructor(private name,private schema:ILunrSchema<M>) {
		this.idxFile = getUserDataFilename(`${name}.idx`)

		log.debug(`Index file for ${name} is ${this.idxFile}`)

		const idxState = readJSONFile(this.idxFile)

		this.idx = (idxState) ? lunr.Index.load(idxState) : lunr(function() {
			const {ref,fields} = schema

			// Add each field with boost
			for (let key of Object.keys(fields)) {
				this.field(key,{boost:fields[key]})
			}

			// Add id ref
			this.ref(ref)
		})

		AllLunrIndexes.push(this)
	}

	get onPersistenceEvent()  {
		const self = this
		return function(type:ModelPersistenceEventType, ...models:M[]) {
			models.forEach(model => {
				(type === ModelPersistenceEventType.Remove) ? self.remove(model) : self.update(model)
			})
		}
	}

	update(model:M) {
		const data = (this.schema.normalizer) ? this.schema.normalizer(model) : model
		this.idx.update(data)
		this.dirty = true
	}

	remove(model:M) {
		if (!model) {
			log.warn(`${this.name} lunr index got null model`)
			return
		}
		this.idx.remove(model)
		this.dirty = true
	}

	/**
	 * Persist the index to disk
	 *
	 * IF INDEX IS NOT DIRTY THEN RETURNS
	 */
	async persist() {
		if (!this.dirty) {
			log.info(`Index ${this.name} NOT dirty ${this.idxFile}`)
			return
		}

		log.info(`Writing index ${this.name} to ${this.idxFile}`)
		await writeJSONFile(this.idxFile,this.idx.toJSON())
		this.dirty = false
	}

	/**
	 * Shutdown the index and persist if dirty
	 */
	async shutdown() {
		await this.persist()

		const index = AllLunrIndexes.findIndex(idx => idx === this)
		if (index > -1) {
			AllLunrIndexes.splice(index,1)
		}
	}
}

