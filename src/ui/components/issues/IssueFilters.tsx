/**
 * Created by jglanz on 7/19/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender} from 'components/common'
import {Milestone} from 'shared/models/Milestone'
import {Label} from 'shared/models/Label'
import {IIssueFilter, IIssueSort, IssueSortableFields,
	IssueGroupByFields, IssueGroupByNames,
	IssueSortableFieldNames} from 'shared/actions/issue/IssueState'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector,createSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {
	milestonesSelector, selectedIssueIdsSelector, labelsSelector,
	issueFilterMilestonesSelector, issuesSelector, issueSortAndFilterSelector, issueFilterLabelsSelector
} from 'shared/actions/issue/IssueSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {Container} from 'typescript-ioc'
import {Icon} from 'ui/components/common/Icon'
import {IssueLabelsAndMilestones} from 'ui/components/issues/IssueLabelsAndMilestones'
import {IconMenu} from 'material-ui'
import {IconButton} from 'material-ui'
import {MenuItem} from 'material-ui'
import {NavigationArrowDropRight as SvgArrowRight,ContentFilterList as SvgFilterIcon} from 'material-ui/svg-icons'
import * as moment from 'moment'
import {Divider} from 'material-ui'



const log = getLogger(__filename)
const tinycolor = require('tinycolor2')

// Styles
const baseStyles = createStyles({
	root: [FlexRow, FlexAuto, FillWidth, {
		padding: '0.5rem 0rem 0.5rem 1rem'
	}],

	filters: [FlexRowCenter,FlexAuto,FillWidth,OverflowHidden,{

		none: [FlexScale,{
			fontWeight: 100,
			fontSize:themeFontSize(1.2)
		}],
		labels: [FlexScale,{
			flexWrap: 'wrap',
			label: [{
				margin: '0.5rem 1rem 0.5rem 0'
			}]
		}],
		groupBy: [FlexAuto,FlexRowCenter,{
			padding: '0.2rem 0 0.2rem 1.4rem',
			borderRadius: '0.3rem',
			margin: '0 0.2rem 0 0',
			boxShadow: '0.1rem 0.1rem 0.1rem rgba(0,0,0,0.4)'
		}]
	}],

	list: {
		item: {

			text: [FlexRowCenter, FillWidth, {
				value: {
					width: 300,
				},
				primary: [FlexAuto, Ellipsis, {
					padding: '0 0 0 1rem',
					fontWeight: 700,
					flexGrow: 1
				}],
				secondary: [FlexScale, Ellipsis, {
					fontWeight: 300
				}],
				spacer: [FlexScale],
				icon: [FlexAuto,{
					width: 18
				}]
			}]
		}

	}
})



/**
 * IIssueFiltersProps
 */
export interface IIssueFiltersProps extends React.DOMAttributes {
	theme?:any
	styles?:any
	issueSort?:IIssueSort
	issueFilter?:IIssueFilter
	issueFilterLabels?:Label[]
	issueFilterMilestones?:Milestone[]
	labels?:Label[]
	milestones?:Milestone[]
}




/**
 * IssueFilters
 *
 * @class IssueFilters
 * @constructor
 **/

@connect(createStructuredSelector({
	issues: issuesSelector,
	issueSort: createSelector(issueSortAndFilterSelector,({issueSort}) => issueSort),
	issueFilter: createSelector(issueSortAndFilterSelector,({issueFilter}) => issueFilter),
	issueFilterLabels: issueFilterLabelsSelector,
	issueFilterMilestones: issueFilterMilestonesSelector,
	labels: labelsSelector,
	milestones: milestonesSelector,
	selectedIssueIds: selectedIssueIdsSelector
},createDeepEqualSelector))

@ThemedStyles(baseStyles,'issueFilters')
@PureRender
export class IssueFilters extends React.Component<IIssueFiltersProps,any> {

	uiActions:UIActionFactory = Container.get(UIActionFactory)
	issueActions:IssueActionFactory = Container.get(IssueActionFactory)

	/**
	 * Event handlers
	 */
	onSortDirectionChanged = () => this.issueActions.toggleSortByDirection()

	onGroupByDirectionChanged = () => this.issueActions.toggleGroupByDirection()

	onRemoveItemFromFilter = (item:Label|Milestone, index:number) => {
		if (Label.isLabel(item))
			this.issueActions.toggleIssueFilterLabel(item)
		else
			this.issueActions.toggleIssueFilterMilestone(item)
	}

	makeOnMilestoneSelected(milestone:Milestone) {
		return (event) => {
			log.info('Milestone toggled',event)
			this.issueActions.toggleIssueFilterMilestone(milestone)
		}
	}

	makeOnLabelSelected(label:Label) {
		return (event) => {
			log.info('Label selected',event)
			this.issueActions.toggleIssueFilterLabel(label)
		}
	}

	makeOnSortBySelected(field:string) {
		return (event) => {
			log.info('Sort by selected',event)
			this.issueActions.setSortByField(field)
		}
	}

	makeOnGroupBySelected(field:string) {
		return (event) => {
			log.info('Group by selected',event)
			this.issueActions.setGroupBy(field)
		}
	}

	/**
	 * Render all label items
	 *
	 * @returns {any[]}
	 */
	renderLabelItems() {


		const
			{
				theme,
				styles,
				issueSort,
				issueFilterLabels,
				labels,
			} = this.props,
			{palette} = theme

		return (labels  || []).map(label => {
			const
				backgroundColor = `#${label.color}`,
				color = tinycolor.mostReadable(backgroundColor,[
					palette.text.primary,
					palette.alternateText.primary
				]).toString(),
				labelStyle = mergeStyles(styles.list.item,{
					cursor: 'pointer',
					backgroundColor,
					color
				}),
				selected = issueFilterLabels.find(item => item.url === label.url)

			const primaryText = <div style={makeStyle(
					styles.list.item.text,
					styles.list.item.text.value
				)}>
				<Icon
					style={{
						opacity: selected ? 1 : 0
					}}
					iconSet='fa'
					iconName='check-circle' />
				<div style={makeStyle(styles.list.item.text.primary,{
					color:labelStyle.color
				})}>
                    {label.name}
                </div>
				<div style={styles.list.item.text.spacer} />
			</div>


			return <MenuItem
				onTouchTap={this.makeOnLabelSelected(label)}
				style={labelStyle}
				primaryText={primaryText}
			/>
		})
	}


	/**
	 * Render milestone items
	 *
	 * @returns {any[]}
	 */
	renderMilestoneItems() {


		const {
			theme,
			styles,
			issueSort,
			issueFilterMilestones,
			milestones,
		} = this.props

		const {palette} = theme

		return (milestones || []).map(milestone => {

			const selected = issueFilterMilestones.find(item => item && item.id === milestone.id)

			const primaryText = <div style={makeStyle(
					styles.list.item.text,
					styles.list.item.text.value
				)}>
				<div>
					<Icon
						style={{
							opacity: selected ? 1 : 0
						}}
						iconSet='fa'
						iconName='check-circle' />
				</div>
				<div style={styles.list.item.text.primary}>
					{milestone.title}
				</div>

				<div style={styles.list.item.text.secondary}>
                    {milestone.due_on ? moment(milestone.due_on).fromNow() : 'No Due Date'}
                </div>
			</div>

			return <MenuItem
				onTouchTap={this.makeOnMilestoneSelected(milestone)}
				style={styles.list.item}
				primaryText={primaryText} />

		})
	}

	/**
	 * Render milestone items
	 *
	 * @returns {any[]}
	 */
	renderSortByItems() {


		const {
			theme,
			styles,
			issueSort
		} = this.props

		const fields = IssueSortableFields
		const fieldNames = IssueSortableFieldNames
		const sortedField = issueSort.fields[0]
		const {palette} = theme

		return (fields).map((field,index) => {

			const
				selected = field === sortedField,
				fieldName = fieldNames[index]

			const primaryText = <div style={makeStyle(
					styles.list.item.text,
					styles.list.item.text.value
				)}>
				<div>
					<Icon
						style={{
							opacity: selected ? 1 : 0
						}}
						iconSet='fa'
						iconName='check-circle' />
				</div>
				<div style={styles.list.item.text.primary}>
					{fieldName}
				</div>

				<div style={styles.list.item.text.spacer} />

			</div>

			return <MenuItem
				onTouchTap={this.makeOnSortBySelected(field)}
				style={styles.list.item}
				primaryText={primaryText} />

		})
	}


	/**
	 * Group By Menu Items
	 */
	renderGroupByItems() {
		const {
			theme,
			styles,
			issueSort
		} = this.props

		const fields = IssueGroupByFields
		const fieldNames = IssueGroupByNames
		const groupBy = issueSort.groupBy
		const {palette} = theme

		return (fields).map((field,index) => {

			const
				selected = field === groupBy,
				fieldName = fieldNames[index]

			const primaryText = <div style={makeStyle(
					styles.list.item.text,
					styles.list.item.text.value
				)}>
				<div>
					<Icon
						style={{
							opacity: selected ? 1 : 0
						}}
						iconSet='fa'
						iconName='check-circle' />
				</div>
				<div style={styles.list.item.text.primary}>
					{fieldName}
				</div>

				<div style={styles.list.item.text.spacer} />

			</div>

			return <MenuItem
				onTouchTap={this.makeOnGroupBySelected(field)}
				style={styles.list.item}
				primaryText={primaryText} />

		})
	}

	/**
	 * Render filters
	 *
	 * @returns {any}
	 */
	render() {

		const
			{
				theme,
				styles,
				issueSort,
				issueFilterLabels,
				issueFilterMilestones,
				labels,
				milestones,
			} = this.props,
			{palette} = theme,
			isGrouped = issueSort.groupBy !== 'none',
			hasFilters =
				_.size(_.nilFilter(issueFilterLabels || [])) +
				_.size(_.nilFilter(issueFilterMilestones || [])) > 0


		// LABEL
		const labelMenuItemText = <div style={styles.list.item.text}>
			<div>
				<Icon style={styles.list.item.text.icon}
				      iconSet='octicon'
				      iconName='tag'/>
			</div>
			<div style={styles.list.item.text.primary}>
				Labels
			</div>
			<div style={styles.list.item.text.spacer} />
			<div style={styles.list.item.text.icon}>
				<SvgArrowRight style={{display:'block'}} />
			</div>
		</div>

		// MILESTONE
		const milestoneMenuItemText = <div style={styles.list.item.text}>
			<div>
				<Icon style={styles.list.item.text.icon}
				      iconSet='octicon'
				      iconName='milestone'/>
			</div>
			<div style={styles.list.item.text.primary}>
				Milestones
			</div>
			<div style={styles.list.item.text.spacer} />
			<div style={styles.list.item.text.icon}>
				<SvgArrowRight style={{display:'block'}} />
			</div>
		</div>




		// SORT ORDER
		let isAscending = issueSort.direction === 'asc'
		const sortOrderMenuItemText = <div style={styles.list.item.text}>
			<div>
				<Icon style={makeStyle(styles.list.item.text.icon,{
					fontSize: 12
				})} iconSet='fa' iconName={isAscending ? 'chevron-up' : 'chevron-down'}/>
			</div>
			<div style={styles.list.item.text.primary}>
				Sorted in {isAscending ? 'Ascending' : 'Descending'} Order
			</div>
			<div style={styles.list.item.text.spacer} />
		</div>

		// SORT BY
		const sortByMenuItemText = <div style={styles.list.item.text}>
			<div>
				<Icon style={styles.list.item.text.icon} iconSet='fa' iconName='sort'/>
			</div>
			<div style={styles.list.item.text.primary}>
				Sort by
			</div>
			<div style={styles.list.item.text.spacer} />
			<div style={styles.list.item.text.icon}>
				<SvgArrowRight style={{display:'block'}} />
			</div>
		</div>


		// GROUP BY DIRECTION
		isAscending = issueSort.groupByDirection === 'asc'
		const groupByDirectionMenuItemText = <div style={styles.list.item.text}>
			<div>
				<Icon style={makeStyle(styles.list.item.text.icon,{
					fontSize: 12
				})} iconSet='fa' iconName={isAscending ? 'chevron-up' : 'chevron-down'}/>
			</div>
			<div style={styles.list.item.text.primary}>
				Group by {isAscending ? 'Ascending' : 'Descending'} Order
			</div>
			<div style={styles.list.item.text.spacer} />
		</div>

		// GROUP BY
		const groupByMenuItemText = <div style={styles.list.item.text}>
			<div>
				<Icon style={styles.list.item.text.icon}
				      iconSet='fa'
				      iconName='group'/>
			</div>
			<div style={styles.list.item.text.primary}>
				Group by
			</div>
			<div style={styles.list.item.text.spacer} />
			<div style={styles.list.item.text.icon}>
				<SvgArrowRight style={{display:'block'}} />
			</div>
		</div>

		const filterIconStyle:any = {height:24,padding:0}
		if (hasFilters && !isGrouped)
			filterIconStyle.color = theme.issueFilters.hasFiltersColor



		{/* Filter menu */}
		const filterMenu = <IconMenu iconButtonElement={<IconButton style={filterIconStyle} iconStyle={filterIconStyle}><SvgFilterIcon /></IconButton>}
		          style={filterIconStyle}
		          listStyle={theme.list} >

			{/* SORT ORDER */}
			<MenuItem primaryText={sortOrderMenuItemText}
			          listStyle={theme.list}
			          onTouchTap={this.onSortDirectionChanged} />

			{/* SORT BY */}
			<MenuItem primaryText={sortByMenuItemText}
			          listStyle={theme.list}
			          menuItems={this.renderSortByItems()} />

			<Divider />

			{/* SORT ORDER */}
			{ issueSort.groupBy !== 'none' &&
			<MenuItem primaryText={groupByDirectionMenuItemText}
			          listStyle={theme.list}
			          onTouchTap={this.onGroupByDirectionChanged}/>
			}

			{/* GROUP BY */}
			<MenuItem primaryText={groupByMenuItemText}
			          listStyle={theme.list}
			          menuItems={this.renderGroupByItems()}
			/>

			<Divider />

			{/* LABELS */}
			<MenuItem primaryText={labelMenuItemText}
			          listStyle={theme.list}
			          menuItems={this.renderLabelItems()} />

			{/* MILESTONES */}
			<MenuItem primaryText={milestoneMenuItemText}
			          menuItems={this.renderMilestoneItems()} />
		</IconMenu>

		// ASSEMBLE
		return <div style={styles.root}>
			<div style={styles.filters}>

				{/*<Icon iconSet="fa"*/}
				      {/*iconName="filter"*/}
				      {/*style={{paddingRight:'1rem'}}
				      */}
				{/*/>*/}

				{!hasFilters ?
					<div style={styles.filters.none}>no filters</div> :
					<IssueLabelsAndMilestones
						style={styles.filters.labels}
						labelStyle={styles.filters.labels.label}
						onRemove={this.onRemoveItemFromFilter}
					    showIcon={true}
					    labels={issueFilterLabels}
						milestones={issueFilterMilestones}
					/>
				}

				{/* SPACER to fill empty if any */}
				{/*<div style={FlexScale}></div>*/}
				{isGrouped ? <div style={styles.filters.groupBy}>
					{issueSort.groupBy}
					{filterMenu}
				</div> : filterMenu}


			</div>



		</div>
	}

}