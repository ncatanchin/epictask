import { Map, Record, List } from "immutable"
import { DefaultIssueCriteria } from "epic-models"
import { shortId } from "epic-global"

/**
 * Created by jglanz on 12/24/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


const IssueListConfigRecord = Record({
	id: null,
	name: null,
	criteria: DefaultIssueCriteria,
	saved: false,
	updatedAt: Date.now()
	
})



/**
 * IssueListConfig
 *
 * @class IssueListConfig
 * @constructor
 **/
@ModelRegistryScope.Register
export class IssueListConfig extends IssueListConfigRecord {
	
	static fromJS(o:any = {}) {
		return new IssueListConfig(o)
	}
	
	static create() {
		return new IssueListConfig({id:shortId()})
	}
	
	id:string
	name:string
	criteria:IIssueCriteria
	saved:boolean
	updatedAt: number
	
	private constructor(o:any = {}) {
		super(o)
	}
	
	
	/**
	 * Timestamp the object
	 * @returns {Map<string, V>}
	 */
	timestamp():this {
		return this.merge({
			updatedAt:Date.now()
		}) as this
	}
	
	
}
