import 'lunr'
import {ModelPersistenceEventType} from 'typestore'
import {getUserDataFilename, readFileSync, writeFileSync, readJSONFileSync, writeJSONFileSync} from './util/Files'

const log = getLogger(__filename)

export interface ILunrSchema<M> {
	ref:string
	fields:{[field:string]:number}
	normalizer?:(model:M) => any
}

export const AllLunrIndexes= []

export class LunrIndex<M> {

	private idxFile
	private idx
	private dirty = false

	constructor(private modelType:{new():M;},private schema:ILunrSchema<M>) {
		this.idxFile = getUserDataFilename(`${modelType.name}.idx`)

		log.debug(`Index file for ${modelType.name} is ${this.idxFile}`)
		this.idx = lunr(function() {
			const {ref,fields} = schema

			// Add each field with boost
			for (let key of Object.keys(fields)) {
				this.field(key,{boost:fields[key]})
			}

			// Add id ref
			this.ref(ref)
		})



		const idxState = readJSONFileSync(this.idxFile)
		if (idxState) {
			this.idx.load(idxState)
		}

		AllLunrIndexes.push(this)
	}

	onPersistenceEvent = (type:ModelPersistenceEventType, model:M) => {
		(type === ModelPersistenceEventType.Remove) ? this.remove(model) : this.update(model)
	}

	update(model:M) {
		const data = (this.schema.normalizer) ? this.schema.normalizer(model) : model
		this.idx.update(data)
		this.dirty = true
	}

	remove(model:M) {
		this.idx.remove(model)
		this.dirty = true
	}

	/**
	 * Persist the index to disk
	 *
	 * IF INDEX IS NOT DIRTY THEN RETURNS
	 */
	persist() {
		if (!this.dirty)
			return

		writeJSONFileSync(this.idxFile,this.idx.toJSON())
		this.dirty = false
	}

	/**
	 * Shutdown the index and persist if dirty
	 */
	shutdown() {
		this.persist()

		const index = AllLunrIndexes.findIndex(idx => idx === this)
		if (index > -1) {
			AllLunrIndexes.splice(index,1)
		}
	}


}