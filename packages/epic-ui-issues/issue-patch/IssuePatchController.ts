import { List } from "immutable"
import IssuePatchState from "./IssuePatchState"
import { parseJSON} from "epic-util"
import { notifyError } from "epic-global"
import { getValue } from "typeguard"
import { Issue } from "epic-models"
import { getIssueActions } from "epic-typedux/provider"
import { StoreViewController } from "epic-ui-components/layout"

/**
 * Created by jglanz on 11/12/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * IssuePatchController
 *
 * @class IssuePatchController
 * @constructor
 **/
class IssuePatchController extends StoreViewController<IssuePatchState> {
	
	private init = false
	
	constructor(id:string,initialState:IssuePatchState = new IssuePatchState(),opts:any = {}) {
		super(id,initialState,opts)
		
	}
	
	/**
	 * On mount - load issues
	 *
	 * @param mounted
	 * @param props
	 */
	setMounted(mounted:boolean,props) {
		if (this.init)
			return
		
		this.init = true
		
		const
			{params} = props,
			
			{issueKeys: issueKeysStr,mode} = params,
			issueKeysJson = getValue(() => issueKeysStr,"[]"),
			issueKeys = List<string>(parseJSON(issueKeysJson)),
			
			setReady = () => this.updateState({
				mode,
				ready: true
			})
		
		log.info(`Issue keys`,issueKeys)
		if (!issueKeys || !issueKeys.size) {
			notifyError(`No issues were provided`)
			setReady()
		} else {
			this.loadIssues(issueKeys).then((issues) => {
				log.debug(`Loaded issues`, issues)
				setReady()
			})
		}
		
		
	}
	
	/**
	 * Load patching issues
	 *
	 * @param issueKeys
	 */
	async loadIssues(issueKeys:List<string>) {
		
		const
			issues = await getIssueActions().loadIssues(issueKeys)
		
		if (!issues) {
			notifyError(`No issues loaded for ${issueKeys.size}`)
			return
		}
		this.setIssues(issues)
		return issues
	
	}
	
	
	
	/**
	 * Set saving
	 *
	 * @param saving
	 */
	setSaving(saving:boolean) {
		this.updateState({saving})
	}
	
	/**
	 * Save error
	 *
	 * @param saveError
	 */
	setSaveError(saveError) {
		this.updateState({saveError})
	}
	
	/**
	 * Set the editing issue
	 *
	 * @param issues
	 */
	setIssues(issues:List<Issue>) {
		this.updateState({
			issues,
			issueKeys: issues.map(issue => Issue.makeIssueId(issue))
		})
	}
	
}

export default IssuePatchController