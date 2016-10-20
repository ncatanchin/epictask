


// Imports
import * as moment from 'moment'
import * as React from 'react'
import {List} from 'immutable'
import {Renderers, Avatar} from 'ui/components/common'
import {connect} from 'react-redux'
import filterProps from 'react-valid-props'
import { IssueLabelsAndMilestones, IssuesPanel } from 'ui/components/issues'
import {Issue} from 'shared/models'

import { selectedIssueIdsSelector, issuesSelector, focusedIssueIdsSelector } from "shared/actions/issue/IssueSelectors"
import {createSelector} from 'reselect'
import {IssueStateIcon} from 'ui/components/issues/IssueStateIcon'

import { shallowEquals, getValue } from "shared/util/ObjectUtil"
import { ThemedStyles, IThemedAttributes } from "shared/themes/ThemeDecorations"
import { colorAlpha } from "shared/themes/styles/ColorTools"
import {createStructuredSelector} from 'reselect'

const
	log = getLogger(__filename)

function baseStyles(topStyles,theme,palette) {
	
	const
		{background,primary,accent,secondary,text} = palette
	
	return [
		makeTransition(['height', 'flex-grow', 'flex-shrink', 'flex-basis','box-shadow']),
		FlexRowCenter,
		FlexAuto,
		FillWidth,
		FillHeight,
		FlexAlignStart,
		makePaddingRem(1,1,0,0.6),
		{
			// COLORS
			backgroundColor: background,
			color: text.secondary,
			//boxShadow: 'inset 0rem -0.1rem 0rem 0rem ' + colorAlpha(primary.hue2,1),
			
			// LAYOUT
			height: rem(9.4),
			cursor: 'pointer',
			
			
			bar: [PositionAbsolute,{
				top: 0,
				left: 0,
				bottom: 0,
				zIndex: 10,
				borderLeft: `0.6rem inset ${Transparent}`
				
			}],
			
			// MARKED AS FOCUSED
			focused: [{
				color: text.primary,
				bar: [{
					borderLeft: `0.6rem inset ${accent.hue1}`
				}]
			}],
			
			// SELECTED
			selected: [{
				backgroundColor: primary.hue2,
				color: text.primary,
				
				bar: [{
					borderLeft: `0.6rem inset ${colorAlpha(secondary.hue2,0.8)}`
				}],
				//boxShadow: 'inset 0rem 0rem 0.1rem 0.1rem ' + colorAlpha(secondary.hue1,0.4),
				
				multi: [{
					backgroundColor: primary.hue2,
					color: text.primary
				}]
			}],
			
			details: [FlexColumn, FlexScale, OverflowHidden, {
				padding: '0 0.5rem'
			}],
			
			// AVATAR
			avatar: [{
				padding: '0'
			}],
			
			number: [{
				fontSize: themeFontSize(1.1),
				fontWeight: 500,
				color: text.primary
			}],
			
			
			row1: [FlexRow, makeFlexAlign('center', 'center'), {
				pointerEvents: 'none',
				padding: '0 0 0.5rem 0rem'
			}],
			
			repo: [Ellipsis, FlexRow, FlexScale, makeTransition(['color','font-size']), {
				fontSize: themeFontSize(1),
				color: text.secondary,
				//fontFamily: fontFamilyRegular,
				fontWeight: 300,
				selected: [{
					fontWeight: 300,
					fontSize: themeFontSize(1.1),
					color: secondary.hue1,
				}]
			}],
			
			row2: [makeTransition(['height']), FlexRowCenter, FillWidth, OverflowHidden, {
				padding: '0 0 1rem 0',
				pointerEvents: 'none'
			}],
			
			title: [makeTransition(['font-size', 'font-weight']), Ellipsis, FlexScale, {
				display: 'block',
				padding: '0 1rem 0 0',
				
				color: text.primary,
				fontWeight: 400,
				fontSize: themeFontSize(1.2),
				
				selected: [{
					fontWeight: 500,
					color: text.primary,
					
					fontSize: themeFontSize(1.2),
					
					multi: [{
						
					}]
				}],
			}],
			
			time: [FlexAuto, {
				fontSize: themeFontSize(1),
				fontWeight: 100,
			}],
			
			
			row3: makeStyle(FlexRowCenter, {
				margin: '0rem 0 0.3rem 0',
				overflow: 'auto'
			}),
			
			
			/**
			 * labels
			 */
			
			labels: [makePaddingRem(), FlexScale, {
				overflowX: 'auto',
				
				wrapper: [FlexScale,{
					overflow: 'hidden',
					marginRight: rem(1)
				}],
				//flexWrap: 'wrap',
				
				label: {
					marginTop: 0,
					marginRight: '0.7rem',
					marginBottom: '0.5rem',
					marginLeft: 0
				}
				
			}],
			
			/**
			 * Milestone
			 */
			milestone: [FlexAuto, Ellipsis, {
				fontSize: themeFontSize(1),
				padding: '0 1rem',
				color: text.secondary
			}],
			
			state: [{
				root:[{
					marginLeft: rem(0.5)
				}]
			}]
		}
	]
}

export interface IIssueItemProps extends IThemedAttributes {
	
	issueId:number
	
	
	onOpen?:(event:any, issue:Issue) => void
	onSelected:(event:any, issue:Issue) => void
	issue?:Issue
	isFocused?:boolean
}

export interface IIssueItemState {
	
	isSelected?:boolean
	isSelectedMulti?:boolean
}
//
// // State is connected at the item level to minimize redraws for the whole issue list
@connect(() => {
	const
		issueSelector = createSelector(
			issuesSelector,
			(state, props:IIssueItemProps) => props.issueId,
			(issues:List<Issue>, issueId:number):Issue => {
				return issues.find(issue => issue.id === issueId)
			}
		),
		isFocusedSelector = createSelector(
			issueSelector,
			focusedIssueIdsSelector,
			(issue:Issue, focusedIssueIds:number[]) =>
			issue &&
			focusedIssueIds &&
			focusedIssueIds.includes(issue.id)
		)
		
		
		return createStructuredSelector({
		issue: issueSelector,
		isFocused: isFocusedSelector
	})
})
// 		isSelectedSelector = createSelector(
// 			issueSelector,
// 			selectedIssueIdsSelector,
// 			(issue:Issue, selectedIssueIds:number[]) =>
// 				issue &&
// 				selectedIssueIds &&
// 				selectedIssueIds.includes(issue.id)
// 		),
// 		isSelectedMultiSelector = createSelector(
// 			isSelectedSelector,
// 			selectedIssueIdsSelector,
// 			(isSelected, selectedIssueIds:number[]) =>
// 				isSelected &&
// 				selectedIssueIds &&
// 				selectedIssueIds.length > 1
// 		),
//
// 	return createStructuredSelector({
// 		issue: issueSelector,
// 		isFocused: isFocusedSelector,
// 		isSelected: isSelectedSelector,
// 		isSelectedMulti: isSelectedMultiSelector
// 	})
// })
@ThemedStyles(baseStyles)
class IssueItem extends React.Component<IIssueItemProps,IIssueItemState> {
	
	static contextTypes = {
		issuesPanel:React.PropTypes.object
	}
	
	get issuesPanel() {
		return getValue(() => (this.context as any).issuesPanel) as IssuesPanel
	}
	
	private updateState = () => {
		const
			issuesPanel = this.issuesPanel
		
		if (issuesPanel) {
			const
				{issue} = this.props,
				{ selectedIssueIds } = issuesPanel,
				isSelected = issue && selectedIssueIds && selectedIssueIds.includes(issue.id)
			
			
			
			this.setState({
				isSelected,
				isSelectedMulti: isSelected && selectedIssueIds.length > 1
			})
		}
	}
	
	
	
	
	componentWillMount() {
		const
			{issuesPanel} = this
		
		issuesPanel.addSelectListener(this.updateState)
		this.updateState()
		
	}
	
	componentWillUnmount() {
		const
			{issuesPanel} = this
		
		issuesPanel.removeSelectListener(this.updateState)
	}
	
	/**
	 * Checks whether the item should update comparing
	 * selected, selectedMulti and item ref
	 *
	 * @param nextProps
	 * @returns {boolean}
	 * @param nextState
	 */
	shouldComponentUpdate(nextProps:IIssueItemProps,nextState:IIssueItemState) {
		return !shallowEquals(
			nextProps,
			this.props,
			'isFocused',
			'issue.id',
			'issue.labels',
			'issue.milestone',
			'issue.updated_at'
		) || !shallowEquals(
				nextState,
				this.state,
				'isSelected',
				'isSelectedMulti'
			)
	}
	
	/**
	 * Render the item
	 *
	 * @returns {any}
	 */
	render() {
		
		const
			{props,state} = this,
			{
				style:styleParam,
				styles,
				issue,
				onOpen,
				isFocused,
				onSelected
			} = props,
			{
				
				isSelected,
				isSelectedMulti
			} = state
			
			
		if (!issue)
			return React.DOM.noscript()

		const
			{labels} = issue,
			
			issueStyles = makeStyle(
				styles,
				isSelected && styles.selected,
				(isSelectedMulti) && styles.multi,
				isFocused && styles.focused,
				styleParam // PARAM PASSED FROM LIST
			),
			issueTitleStyle = makeStyle(
				styles.title,
				isSelected && styles.title.selected,
				isSelectedMulti && styles.title.selected.multi
			)

		return <div {...filterProps(props)} id={`issue-item-${issue.id}`}
		                                    style={issueStyles}
		                                    className={(isSelected ? 'selected' : '')}
		                                    onDoubleClick={event => onOpen && onOpen(event,issue)}
		                                    onClick={(event) => onSelected(event,issue)}>

			{/*<div style={stylesMarkers}></div>*/}
			<div style={styles.details}>

				<div style={styles.row1}>
					<div style={styles.repo}>
						<span style={styles.number}>
							#{issue.number}&nbsp;&nbsp;
						</span>
						<Renderers.RepoName repo={issue.repo} style={makeStyle(styles.repo,isSelected && styles.repo.selected)}/>
						
					</div>

					{/* ASSIGNEE */}
					<Avatar user={issue.assignee}
					        style={styles.avatar}
					        labelPlacement='before'
					        labelStyle={styles.username}
					        avatarStyle={styles.avatar}/>

				</div>


				<div style={styles.row2}>
					<div style={issueTitleStyle}>{issue.title}</div>
					<div style={styles.time}>{moment(issue.updated_at).fromNow()}</div>
				</div>

				<div style={styles.row3}>

					{/* LABELS */}
					<div style={styles.labels.wrapper}>
						<IssueLabelsAndMilestones
							showIcon
							labels={labels}
							milestones={issue.milestone ? [issue.milestone] : []}
							style={styles.labels}
							labelStyle={styles.labels.label}
						/>
					</div>
					


					<IssueStateIcon styles={[styles.state]}
					                issue={issue}/>
					
				</div>
			</div>
			
			{/* FOCUSED MARKING BAR */}
			<div style={[
				styles.bar,
				isSelected && styles.selected.bar,
				isFocused && styles.focused.bar
			]}/>
			
		</div>

	}
}

export default IssueItem