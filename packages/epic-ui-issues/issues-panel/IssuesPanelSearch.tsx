// Imports
import { List } from "immutable"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { FlexRowCenter, PureRender, Chip, RepoLabel, SearchField } from "epic-ui-components"
import { IThemedAttributes, ThemedStyles, makePaddingRem, makeHeightConstraint, rem } from "epic-styles"
import { getIssuesPanelSelector, IssuesPanelController } from "./IssuesPanelController"
import { cloneObjectShallow, cloneObject, safePush } from "epic-global"
import { ContainerNames, getCommandManager } from "epic-command-manager"
import { SearchItem, User, Label, Milestone, Repo, DefaultIssueSort, IssueCriteriaKeywords } from "epic-models"
import { isNil, getValue } from "typeguard"
import { IssuesPanelSearchItem } from "./IssuesPanelSearchItem"
import { availableReposSelector, assigneesSelector, labelsSelector, milestonesSelector } from "epic-typedux"
import { IssuesPanelState } from "./IssuesPanelState"

// const
// 	searchQueryParser = require('search-query-parser')

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [
		makePaddingRem(0, 1),
		{
			//backgroundColor: Transparent,
			wrapper: [
				//Styles.makeFlex(0, 0, 'auto'),
				Styles.FlexScale,
				Styles.makeTransition([ 'flex-grow', 'flex-shrink', 'flex-basis', 'height', 'min-height', 'max-height' ]),
				Styles.makePaddingRem(0.5),{
					minHeight: rem(5.5),
					border: `none`,
					backgroundColor: primary.hue2,
				}
			],
			
			//borderBottom: `0.1rem solid ${primary.hue3}`,
			field: [{
				backgroundColor: primary.hue2,
			}],
			input: [ {
				backgroundColor: primary.hue3,
				
				border: `${convertRem(0.1)}px solid ${Styles.Transparent}`,
				color: text.secondary,
				fontWeight: 500,
				fontSize: themeFontSize(1.7),
				':focus': [ {} ]
			} ]
			
			
		} ]
}


/**
 * IIssuesPanelSearchProps
 */
export interface IIssuesPanelSearchProps extends IThemedAttributes {
	viewController: IssuesPanelController
	//viewState: IssuesPanelState
	criteria?: IIssueCriteria
	searchText?: string
}

/**
 * IIssuesPanelSearchState
 */
export interface IIssuesPanelSearchState {
	focused?: boolean
}

/**
 * IssuesPanelSearch
 *
 * @class IssuesPanelSearch
 * @constructor
 **/

@connect(() => createStructuredSelector({
	criteria: getIssuesPanelSelector(selectors => selectors.criteriaSelector),
	searchText: getIssuesPanelSelector(selectors => selectors.searchTextSelector),
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles, 'issuesPanelSearch')
@PureRender
export class IssuesPanelSearch extends React.Component<IIssuesPanelSearchProps,IIssuesPanelSearchState> {
	
	/**
	 * Refs
	 */
	refs: any
	
	/**
	 * Search provider
	 */
	private searchProvider = new IssuesPanelSearchProvider(this)
	
	get viewController() {
		return this.props.viewController
	}
	
	private makeCriteriaChange(fn: (criteria: IIssueCriteria) => IIssueCriteria): Function {
		return (item, event) => {
			const
				criteria = cloneObjectShallow(this.props.criteria)
			
			this.viewController.setCriteria(fn(criteria))
		}
	}
	
	/**
	 * Renderer criteria elements
	 *
	 * @param criteria
	 * @returns {Array}
	 */
	private criteriaRenderer = (criteria: IIssueCriteria) => {
		const
			{palette} = this.props,
			{ sort } = criteria,
			storeState = getStoreState(),
			
			milestones = milestonesSelector(storeState),
			labels = labelsSelector(storeState),
			assignees = assigneesSelector(storeState),
			repos = availableReposSelector(storeState)
		
		const
			chips = [],
			chipStyle = makeStyle(
				makeMarginRem(0, 0.3, 0, 0.5),
				makeHeightConstraint(rem(2.6)), {
					borderRadius: rem(1.3),
					text: {
						fontSize: rem(1.2),
						fontWeight: 500
					}
				}
			),
			chipAccessoryStyle = makeStyle({
				borderRadius: rem(1.3),
				height: rem(2.6),
				width: rem(2.6),
				[Styles.CSSHoverState]: {
					backgroundColor: 'white',
					color: this.props.palette.warn.hue1
				},
				icon: {
					fontSize: rem(1.4),
					[Styles.CSSHoverState]: {
						fontSize: rem(1.6)
					}
				}
			
			}),
			
			labelStyle = {
				fontWeight: 400
			},
			
			valueStyle = {
				fontWeight: 700
			},
			
			makeLabel = (labelText, valueText) =>
				<FlexRowCenter>
					<div style={labelStyle}>{labelText}:&nbsp;</div>
					<div style={valueStyle}>{valueText}</div>
				</FlexRowCenter>
		
		
		
		// TEXT
		if (criteria.text) {
			chips.push({onRemove:
					this.makeCriteriaChange(criteria =>
						assign(criteria,{text:null})),
				
				key:'text',
				item:{
					id: criteria.text,
					label: makeLabel(`contains`,criteria.text),
					color: palette.secondary.hue1.substring(1)
				}
			})
		}
		
		// CLOSED
		if (criteria.includeClosed) {
			chips.push({
				onRemove: this.makeCriteriaChange(criteria =>
					assign(criteria, { includeClosed: false })),
				key: 'includeClosed',
				item: {
					id: 'includeClosed',
					label: 'include closed',
					color: palette.warn.hue1.substring(1)
				}
			})
		}
		// MILESTONES
		if (criteria.milestoneIds) {
			chips.push(...criteria.milestoneIds
				.map(id => milestones.find(it => it.id === id))
				.filter(it => !isNil(it))
				.map(it => ({
					onRemove: this.makeCriteriaChange(criteria =>
						assign(criteria, {
							milestoneIds: criteria
								.milestoneIds
								.filter(id => it.id !== id)
						}))
					,
					key: `milestone-${it.id}`,
					item: {
						id: `milestone-${it.id}`,
						label: makeLabel('milestone',it.title),
						color: '000000'
					}
				}))
			)
		}
		// ASSIGNEES
		if (criteria.assigneeIds) {
			chips.push(...criteria.assigneeIds
				.map(id => assignees.find(it => it.id === id))
				.filter(it => !isNil(it))
				.map(it => ({
							onRemove: this.makeCriteriaChange(criteria =>
								assign(criteria, {
									assigneeIds: criteria
										.assigneeIds
										.filter(id => it.id !== id)
								}))
							,
							key: `assignee-${it.id}`,
							item: {
								id: `assignee-${it.id}`,
								label: `assigned to: ${it.name || it.login}`,
								color: 'ffffff'
							}
						}
					)
				)
			)
		}
		// REPOS
		if (criteria.repoIds) {
			const
				repoLabelStyle = {
					paddingRight: rem(0.5)
				}
			
			chips.push(...criteria.repoIds
				.map(id => repos.find(it => it.id === id))
				.filter(it => !isNil(it))
				.map(it => ({
					onRemove: this.makeCriteriaChange(criteria =>
						assign(criteria, {
							repoIds: criteria
								.repoIds
								.filter(id => it.id !== id)
						})),
					
					
					key: `repo-${it.id}`,
					item: {
						id: `repo-${it.id}`,
						label: <FlexRowCenter>
							<div style={repoLabelStyle}>repo:</div>
							<RepoLabel repo={it.repo}/>
						</FlexRowCenter>,
						color: '000000'
					}
				}))
			)
		}
		// LABELS
		if (criteria.labelIds) {
			chips.push(...criteria.labelIds
				.map(id => labels.find(it => it.id === id))
				.filter(it => !isNil(it))
				.map(it => ({
					onRemove: this.makeCriteriaChange(criteria =>
						assign(criteria, {
							labelIds: criteria
								.labelIds
								.filter(id => it.id !== id)
						})),
					
					key: `label-${it.id}`,
					item: {
						id: `label-${it.id}`,
						label: `label: ${it.name}`,
						color: it.color
					}
				}))
			)
		}
		
		// GROUP BY
		if (sort.groupBy && sort.groupBy !== 'none') {
			chips.push({
					onRemove: this.makeCriteriaChange(criteria =>
						cloneObjectShallow(criteria, {
							sort: assign(sort, {
								groupBy: 'none'
							})
						})),
					
					// style: makeStyle(Styles.makeBorderRem(0.2),{
					// 	borderColor: palette.accent.hue1
					// }),
					//
					// accessoryStyle: makeStyle(Styles.makeBorderRem(0.1),{
					// 	borderColor: palette.accent.hue1,
					// 	borderStyle: 'solid'
					// }),
				
					key: `groupBy`,
					item: {
						id: `groupBy`,
						label: makeLabel(`group by`, sort.groupBy),
						color: palette.success.hue1.substring(1)
					}
				}
			)
			
		}
		
		// SORT BY
		if (sort.fields) {
			chips.push(...sort.fields
				.filter(it => it !== 'created_at')
				.map(it => ({
						onRemove: this.makeCriteriaChange(criteria =>
							cloneObjectShallow(criteria, {
								sort: cloneObjectShallow(sort, {
									fields: sort.fields.filter(field => it !== field)
								})
							})),
						
						
						key: `sortBy-${it}`,
						item: {
							id: `sortBy-${it}`,
							label: makeLabel('sort by',it),
							color: palette.accent.hue1.substring(1)
						}
					})
				)
			)
		}
		// SORT DIRECTION
		if (sort.direction) {
			chips.push({
					onRemove: this.makeCriteriaChange(criteria =>
						assign(criteria, {
							sort: assign(sort, {
								direction: null
							})
						})),
					
					
					key: `sortByDirection`,
					item: {
						id: `sortByDirection`,
						label: makeLabel('sort direction',sort.direction),
						color: palette.accent.hue1.substring(1)
					}
				}
			)
			
		}
		return chips.map(props => <Chip {...props}
			style={mergeStyles(chipStyle,props.style)}
			textStyle={chipStyle.text}
			accessoryStyle={mergeStyles(chipAccessoryStyle,props.accessoryStyle)}
		/>)
	}
	
	/**
	 * On focus
	 *
	 * @param event
	 */
	onFocus = (event) => this.setState({ focused: true })
	
	/**
	 * on blur
	 *
	 * @param event
	 */
	
	onBlur = (event) => this.setState({ focused: false })
	
	/**
	 * On search chip selected
	 *
	 * @param resultItem
	 */
	onItemSelected = (resultItem: ISearchItem) => {
		log.info(`Selected criteria`, resultItem)
		
		
		let
			item = resultItem.value,
			type = item.type,
			criteria = cloneObject(this.props.criteria)
		
		if (!criteria.sort)
			criteria.sort = DefaultIssueSort
		
		let
			sort = criteria.sort
		
		switch (type) {
			case "sortDirection":
				sort.direction = item.value
				break
			
			case "sortBy":
				sort.fields = [ item.value ]
				break
			
			case "groupBy":
				sort.groupBy = item.value
				break
			
			case "text":
				criteria.text = item.value
				break
			
			case "includeClosed":
				criteria.includeClosed = true
				break
			
			case Milestone.$$clazz:
				criteria.milestoneIds = safePush(criteria.milestoneIds, item.value.id)
				break
			
			case Label.$$clazz:
				criteria.labelIds = safePush(criteria.labelIds, item.value.id)
				break
			
			case Repo.$$clazz:
				criteria.repoIds = safePush(criteria.repoIds, item.value.id)
				break
			
			case User.$$clazz:
				criteria.assigneeIds = safePush(criteria.assigneeIds, item.value.id)
				break
		}
		
		this.viewController.setCriteria(criteria)
		//this.viewController.setSearchText(null)
	}
	
	/**
	 * On text changed - let's see if we can parse some
	 * criteria
	 *
	 * @param newText
	 */
	private onSearchTextChanged = (newText) => {
		this.viewController.setSearchText(newText)
		return false
	}
	
	
	/**
	 * On escape sequence close the search
	 */
	private onSearchEscape = () => {
		log.info(`Search escape`)
		
		setTimeout(() => {
			getCommandManager().focusOnContainer(ContainerNames.IssuesPanel)
			
		}, 100)
		return true
	}
	
	
	isVisible() {
		let
			criteria = this.props.criteria || { sort: {} } as any
		
		
		const
			hasText = getValue(() => criteria.text.length, 0) > 0,
			hasSort =
				getValue(() => criteria.sort.fields.length > 0 && !(criteria.sort.fields.length === 1 && criteria.sort.fields[ 0 ] === 'created_at')
					, false) || ![ 'desc', null ].includes(criteria.sort.direction) || ![ 'none', null ].includes(criteria.sort.groupBy) || ![ 'asc', null ].includes(criteria.sort.groupByDirection),
			hasFilter =
				criteria.includeClosed === true ||
				criteria.issueId ||
				getValue(() => criteria.labelIds.length, 0) > 0 ||
				getValue(() => criteria.milestoneIds.length, 0) > 0 ||
				getValue(() => criteria.repoIds.length, 0) > 0 ||
				getValue(() => criteria.assigneeIds.length, 0) > 0,
			hasFocus = getValue(() => this.state.focused)
		
		log.debug(`Visibility`, hasText, hasSort, hasFilter, hasFocus, criteria.sort)
		
		return getValue(() => hasFocus || hasSort || hasFilter || hasText, false) as boolean
		
	}
	
	render() {
		const
			{
				styles,
				open,
				criteria = {} as any,
				searchText
			} = this.props,
			isVisible = this.isVisible()
		
		return !criteria ? React.DOM.noscript() :
			<div style={[Styles.FlexScale,Styles.PositionRelative]}>
				<SearchField
				ref="searchField"
				styles={mergeStyles(styles,!isVisible && {wrapper: Styles.makeFlex(0,0,rem(0))})}
				searchId='issues-search'
				open={open}
				placeholder="Search labels, repos, milestones, assignees, anything"
				criteria={criteria}
				criteriaRenderer={this.criteriaRenderer}
				text={searchText || ""}
				onTextChanged={this.onSearchTextChanged}
				onItemSelected={this.onItemSelected}
				providers={[
					this.searchProvider
				]}
				inputStyle={styles.input}
				onFocus={this.onFocus}
				onBlur={this.onBlur}
				onEscape={this.onSearchEscape}
			/>
			</div>
	}
	
}


const Keywords = IssueCriteriaKeywords

/**
 * Search provider
 */
export class IssuesPanelSearchProvider implements ISearchProvider {
	
	static SortByKeywordToFields = IssueCriteriaKeywords.sortKeywordsToFields
	
	
	static GroupByKeywordToFields = IssueCriteriaKeywords.groupKeywordsToFields
	
	constructor(private issuesSearchField: IssuesPanelSearch) {
		
	}
	
	id = 'IssuesPanelSearch'
	
	name = "Issue filters & sorting"
	
	/**
	 * Used by result list to render the item
	 *
	 * @param item - if item is null then results have not yet been loaded
	 * @param selected
	 * @return {any}
	 */
	render(item: ISearchItem, selected: boolean) {
		log.debug(`Render item`, item, 'selected', selected)
		return <IssuesPanelSearchItem
			item={item.value}
			selected={selected}
		/>
		
	}
	
	
	private closedMatched = (results: List<ISearchItem>, keyword: string, text: string) => {
		results.push(new SearchItem(`closed-true`, this, {
			id: 'includeClosed',
			type: 'includeClosed',
			field: true,
			label: 'includeClosed: true'
		}))
		
		return false
	}
	
	private directionMatched = (results: List<ISearchItem>, keyword: string, text: string) => {
		results.push(new SearchItem(`sortDirection-${keyword}`, this, {
			id: `sortDirection-${keyword}`,
			type: 'sortDirection',
			field: keyword,
			label: `sortDirection: ${keyword}`
		}))
		
		return false
	}
	
	private sortByMatched = (results: List<ISearchItem>, keyword: string, text: string) => {
		const
			sortBy = IssuesPanelSearchProvider.SortByKeywordToFields[ keyword ]
		
		results.push(new SearchItem(`sortBy-${sortBy}`, this, {
			id: `sortBy-${sortBy}`,
			type: 'sortBy',
			value: sortBy,
			label: `sortBy: ${keyword}`
		}))
	}
	
	private groupByMatched = (results: List<ISearchItem>, keyword: string, text: string) => {
		const
			groupBy = IssuesPanelSearchProvider.GroupByKeywordToFields[ keyword ]
		
		results.push(new SearchItem(`groupBy-${groupBy}`, this, {
			id: `groupBy-${groupBy}`,
			type: 'groupBy',
			value: groupBy,
			label: `groupBy: ${keyword}`
		}))
	}
	
	/**
	 * Match keywords and execute callback on each match
	 *
	 * @param results
	 * @param keywords
	 * @param text
	 * @param matchedFn
	 */
	matchKeywords(results: List<ISearchItem>,
	              keywords: string[],
	              text: string,
	              matchedFn: (results, keyword, text) => any) {
		const
			textParts = text.split(' ')
		
		for (let keyword of keywords) {
			if (textParts.some(part => new RegExp(part, "i").test(keyword))) {
				if (matchedFn(results, keyword, text) === false)
					return
			}
		}
	}
	
	
	private matchProps(results: List<ISearchItem>,
	                   items: List<any>,
	                   props: string[],
	                   clazz: IModelConstructor<any>,
	                   labelProp: string,
	                   text: string) {
		const
			textRegEx = new RegExp(text, "i"),
			type = clazz.$$clazz
		
		items.forEach(item => {
			if (props.some(prop => textRegEx.test(_.get(item, prop, '')))) {
				results.push(new SearchItem(`${type}-${item.id}`, this, {
					id: `${type}-${item.id}`,
					type,
					value: item,
					label: `${type.toLowerCase()}: ${_.get(item, labelProp)}`
				}))
			}
		})
	}
	
	/**
	 * Query for results
	 *
	 * @param criteria
	 * @param text
	 */
	async query(criteria, text): Promise<List<ISearchItem>> {
		
		const
			storeState = getStoreState(),
			{ viewController } = this.issuesSearchField,
			results = List<ISearchItem>().asMutable()
		
		// GET DATA
		const
			milestones = milestonesSelector(storeState),
			labels = labelsSelector(storeState),
			assignees = assigneesSelector(storeState),
			repos = availableReposSelector(storeState)
		
		this.matchKeywords(results, Keywords.groupKeywords, text, this.groupByMatched)
		this.matchKeywords(results, Keywords.sortKeywords, text, this.sortByMatched)
		this.matchKeywords(results, Keywords.directionKeywords, text, this.directionMatched)
		this.matchKeywords(results, Keywords.closedKeywords, text, this.closedMatched)
		
		this.matchProps(results, assignees, [ 'name', 'login', 'email' ], User, 'login', text)
		this.matchProps(results, labels, [ 'name' ], Label, 'name', text)
		this.matchProps(results, milestones, [ 'title' ], Milestone, 'title', text)
		this.matchProps(results, repos, [ 'repo.full_name' ], Repo, 'repo.full_name', text)
		
		if (text && text.length) {
			results.push(new SearchItem(`text-${text}`, this, {
				id: `text-${text}`,
				type: 'text',
				value: text,
				label: `containsText: ${text}`
			}))
		}
		
		return results.asImmutable()
	}
}