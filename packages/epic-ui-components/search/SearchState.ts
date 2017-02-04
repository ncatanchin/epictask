
import { Map, Record, List } from "immutable"
import { reviveImmutable } from "epic-util"
import { SearchItem, SearchResult } from "epic-models"


//
// export interface ISearchState {
// 	items:List<SearchItem>
// 	results:List<SearchResult>
// 	working?:boolean
// 	selectedIndex:number
// }

/**
 * Created by jglanz on 11/12/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

export const SearchStateRecord = Record({
	items:List<SearchItem>(),
	results:List<SearchResult>(),
	working:false,
	selectedIndex:0,
	focused: false
	
})

/**
 * CommentEditState
 *
 * @class CommentEditState
 * @constructor
 **/
export class SearchState extends SearchStateRecord {
	
	
	static fromJS(o:any = {}) {
		return reviveImmutable(
			o,
			SearchState,
			['items','results'],
			[]
		)
	}
	
	constructor(o:any = {}) {
		super(o)
	}
	
	/**
	 * toJS()
	 *
	 * @returns {any}
	 */
	toJS() {
		return super.toJS()
	}
	
	focused:boolean
	items:List<SearchItem>
	results:List<SearchResult>
	working?:boolean
	selectedIndex:number
	
}

