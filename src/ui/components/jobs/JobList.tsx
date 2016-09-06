// Imports
import * as React from 'react'
import * as Radium from 'radium'
import {List} from 'immutable'
import {PureRender} from 'ui/components/common'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {TJobIMap, JobActionFactory} from "shared/actions/jobs/JobActionFactory"
import {IJobStatusDetail, IJob} from "shared/actions/jobs/JobTypes"
import {JobItem} from "ui/components/jobs/JobItem"
import {makePaddingRem} from "shared/themes"
import {UIActionFactory} from "shared/actions/ui/UIActionFactory"

// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	
	root: [FillHeight,FillWidth,FlexColumn, FlexScale, {
		minWidth: rem(24),
		flexBasis: rem(24)
	}],
	
	list: [FlexScale, OverflowAuto, {
		item: [FillWidth,makePaddingRem(1.5,1), {
			
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
export interface IJobListProps extends React.HTMLAttributes {
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
	
	
	/**
	 * On job selected
	 *
	 * @param job
	 */
	onSelect = (job:IJob) => {
		Container.get(JobActionFactory).setSelectedId(job.id)
	}
	
	render() {
		const {styles, jobs, selectedId} = this.props
		
		const details:IJobStatusDetail[] =  _.orderBy(
			_.get(this.props,'details',List<IJobStatusDetail>()).toArray(),
			['updatedAt'],['desc'])
		
		return <div style={styles.root}>
			{/* List of Jobs */}
			<div style={styles.list}>
				
				{/* Map Items */}
				{details.map((detail,index) => {
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
						<JobItem job={job} detail={detail} />
					</div>
				})}
			</div>
		</div>
	}
	
}