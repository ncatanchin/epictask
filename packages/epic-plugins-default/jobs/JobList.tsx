// Imports
import { List } from "immutable"
import { PureRender } from "epic-ui-components"
import { ThemedStyles, makePaddingRem } from "epic-styles"
import { TJobIMap, getJobActions, IJobStatusDetail, IJob } from "epic-typedux"
import { JobItem } from "./JobItem"
import { getUIActions } from "epic-typedux/provider/ActionFactoryProvider"
import { getValue } from "epic-global/ObjectUtil"

import JobMonitorController from "epic-plugins-default/jobs/JobMonitorController"


// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	
	root: [FillHeight,FillWidth,FlexColumn, FlexScale, {
		minWidth: rem(24),
		flexBasis: rem(24)
	}],
	
	list: [FlexScale, OverflowAuto, {
		item: [CursorPointer,FillWidth,makePaddingRem(1.5,1), {
			
			selected: [{
				
			}]
		}],
		
		divider: [{
			borderBottomWidth: rem(0.2),
			borderBottomStyle: 'solid'
		}]
	}]
})


/**
 * IJobListProps
 */
export interface IJobListProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	
	jobs:TJobIMap
	details:List<IJobStatusDetail>
	selectedId:string
}

/**
 * JobList
 *
 * @class JobList
 * @constructor
 **/
@ThemedStyles(baseStyles,'jobs')
@PureRender
export class JobList extends React.Component<IJobListProps,void> {
	
	static contextTypes = {
		monitorController:React.PropTypes.object
	}
	
	/**
	 * Get job monitor from context typed
	 *
	 * @returns {JobMonitor}
	 */
	private get controller() {
		return getValue(() => (this.context as any).monitorController) as JobMonitorController
	}
	
	constructor(props,context) {
		super(props,context)
	}
	
	/**
	 * On job selected
	 *
	 * @param job
	 */
	onSelect = (job:IJob) => {
		this.controller.setSelectedId(job.id)
	}
	
	render() {
		const {styles, jobs, selectedId} = this.props
		
		const details:IJobStatusDetail[] =  _.orderBy(
			_.get(this.props,'details',List<IJobStatusDetail>()).toArray(),
			['status','createdAt'],['asc','desc'])
		
		return <div style={styles.root}>
			{/* List of Jobs */}
			<div style={styles.list}>
				
				{/* Map Items */}
				{details
					.filter((detail) => jobs.get(detail.id))
					.map((detail,index) => {
					const
						job = jobs.get(detail.id),
						lastItem = index >= jobs.size - 1
							
					return <div key={job.id}
					            onClick={() => this.onSelect(job)}
					            style={[
												styles.list.item,
												selectedId === job.id && styles.list.item.selected,
												!lastItem && styles.list.divider
											]}>
						<JobItem job={job} labelStyle={{fontWeight:100}} detail={detail} />
					</div>
				})}
			</div>
		</div>
	}
	
}