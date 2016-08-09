/**
 * Created by jglanz on 6/4/16.
 */

// Imports
import {List} from 'immutable'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {connect} from 'react-redux'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'
import {Issue,Repo,AvailableRepo} from 'shared/models'
import {createStructuredSelector} from 'reselect'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {
	SearchResult, SearchType, SearchSource, SearchResultData, SearchItem,
	ISearchItemModel, SearchData
} from 'shared/actions/search/SearchState'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {Renderers} from 'ui/components/common'
import * as Radium from 'radium'
import {PureRender} from 'ui/components/common/PureRender'
import {createSearchDataSelector} from 'shared/actions/search/SearchSelectors'
import {Themed} from 'shared/themes/ThemeManager'
import {repoModelsSelector} from 'shared/actions/data/DataSelectors'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {Icon} from 'ui/components/common/Icon'


// Constants
const log = getLogger(__filename)

const repoActions = new RepoActionFactory()
//const elementClass = require('element-class')
//const styleVisible = styles.resultsModalVisible
//const renderSubtreeIntoContainer = require("react-dom").unstable_renderSubtreeIntoContainer;

const doc = document
const {body} = doc



//region Styles
const styles = {
	resultsModal: {
		position: 'absolute',
		zIndex: 100
	},

	results: makeStyle(makeTransition(),{
		overflow: 'hidden'
	}),

	resultsTitle: {
		fontWeight: 900,
		textTransform: 'uppercase',
		padding: `0.2rem 0.8rem`
	},

	resultSection: makeStyle(makeTransition(null,0.15),{

	}),

	resultSectionTitle: {
		//borderBottom: '0.1rem solid transparent',
		marginBottom: rem(0.2),
		padding: `0.1rem 0.8rem`
	},

	result: makeStyle(makeTransition(),FlexRowCenter,FillWidth,{
		padding: `1rem 1rem`,
		cursor: 'pointer'
	}),

	resultInfo: makeStyle(FlexColumnCenter,makeFlexAlign('stretch','center'),{
		padding: '0.2rem 2rem 0.2rem 1rem'
	}),


	resultLabel: makeStyle(Ellipsis,FlexAuto,{
		flexShrink: 1,
		fontWeight: 100,
		fontSize: rem(1.6),
		padding: '0 0 0.5rem 0'
	}),

	resultLabelSecond: makeStyle(FlexAuto,{
		fontWeight: 100,
		fontSize: rem(1.2)
	}),

	resultLabelSelected: {
		fontWeight: 500
	},

	resultAction: makeStyle(Ellipsis,{
		fontWeight: 100,
		fontSize: rem(1.3),
		textStyle: 'italic'
	}),

	resultActionSelected: {

	},

	resultType: makeStyle(Ellipsis,{
		fontWeight: 100,
		fontSize: rem(1.3),
		textStyle: 'italic',
		borderRadius: rem(0.2),
		padding: rem(0.3)
	}),

	resultTypeSelected: {

	},



	noResults: makeStyle(Ellipsis,{
		fontStyle: 'italic',
		fontSize: rem(0.8),
		opacity: 0.8,
		padding: `0.1rem 1rem`
	}),

	padded: {
		padding: '0.2rem 1rem'
	}
}
//endregion


/**
 * ISearchResultsProps
 */
export interface ISearchResultsListProps {
	anchor?: string | React.ReactElement<any>
	searchId:string
	containerStyle?:any
	inline?: boolean
	theme?:any
	open:boolean
	selectedIndex?:number
	className?:string
	repoModels?:Map<string,Repo>
	searchItemModels?:ISearchItemModel[]
	results?:SearchResultData[]
	onResultSelected?:(itemModel:ISearchItemModel) => void
	onResultHover?:(itemModel:ISearchItemModel) => void
}

/**
 * SearchResults
 *
 * @class SearchResults
 * @constructor
 **/
@connect(createStructuredSelector({
	repoModels:repoModelsSelector
}),null,null,{withRef:true})
@Radium
@Themed
export class SearchResultsList extends React.Component<ISearchResultsListProps,any> {


	/**
	 * Mount node for search results
	 */
	private node:HTMLElement

	constructor(props,context) {
		super(props,context)
	}

	componentDidMount():void {


		this.node = doc.createElement('div')
		_.assign(this.node.style, styles.resultsModal)

		body.appendChild(this.node)
		this.renderResults(this.props)
	}

	componentWillReceiveProps(nextProps:ISearchResultsListProps, nextContext:any):void {
		if (!nextProps.inline && !_.isEqual(nextProps,this.props))
			this.renderResults(nextProps)
	}

	componentWillUnmount():void {

		ReactDOM.unmountComponentAtNode(this.node)
		body.removeChild(this.node)
		// elementClass(body).remove(styleVisible)
	}



	getThemeStyles() {
		const {theme} = this.props
		return theme ? theme.searchResults : {}
	}


	renderResult(label:any,labelSecond:any,actionLabel,typeLabel,isSelected) {
		const
			// Get theme pack
			themeStyles = this.getThemeStyles(),

			// Make style
			resultStyle = makeStyle(
				styles.result,
				themeStyles.result.normal,
				isSelected && themeStyles.result.selected
			),

			actionStyle = makeStyle(
				styles.resultAction,
				themeStyles.content.action,
				isSelected && styles.resultActionSelected,
				isSelected && themeStyles.content.selected
			),

			labelStyle = makeStyle(
				styles.resultLabel,
				themeStyles.content.label,
				isSelected && styles.resultLabelSelected,
				isSelected && themeStyles.content.selected
			),

			typeStyle = makeStyle(
				styles.resultType,
				themeStyles.content.type,
				isSelected && styles.resultTypeSelected
			)

		return <div style={resultStyle}>
			<div style={makeStyle(typeStyle,styles.padded)}>
				<Icon iconSet='octicon' iconName={typeLabel}/>
				{/*{typeLabel}*/}
			</div>
			<div style={makeStyle(styles.resultInfo,styles.padded)}>
				<div style={labelStyle}>
					{label}
				</div>
				{/*<div style={actionStyle}>*/}
					{/*{actionLabel}*/}
				{/*</div>*/}
			</div>
			<div style={makeStyle(labelStyle,styles.resultLabelSecond,styles.padded)}>
				{labelSecond}
			</div>

		</div>
	}

	renderRepo = (item:SearchItem,repo:Repo,isSelected) => {

		return this.renderResult(
			Renderers.repoName(repo),
			`${repo.open_issues_count} open issues`,
			'Add issue repo',
			'repo',
			isSelected
		)
	}

	/**
	 * Render an available repo, once allready initialized
	 *
	 * @param item
	 * @param availRepo
	 * @param isSelected
	 * @returns {any}
	 */
	renderAvailableRepo = (item:SearchItem,availRepo:AvailableRepo,isSelected) => {
		// const
		// 	// Get data
		// 	availRepoSelected = availRepo.enabled,
		// 	repo = availRepo.repo || repoActions.state.stores.find(item => item.id === availRepo.repoId)
		//
		// // The wrapper element with content inside
		// // Row 1: label
		// // Row 2: possible action
		// return this.renderResult(
		// 	Renderers.repoName(repo),
		// 	`${repo.open_issues_count} open issues`,
		// 	(availRepoSelected) ? 'Hide issues' : 'Show Issues',
		// 	'repo',
		// 	isSelected)
		return null

	}

	renderIssue = (item:SearchItem,issue:Issue,isSelected) => {
		const {repoModels} = this.props
		const repo = repoModels && repoModels.get(`${issue.repoId}`)
		return this.renderResult(
			issue.title,
			repo ? Renderers.repoName(repo) : '',
			'Select issue',
			'issue-opened',
			isSelected
		)
	}

	renderMilestone = (item:SearchItem,milestone:Milestone,isSelected) => {
		const {repoModels} = this.props
		const repo = repoModels && repoModels.get(`${milestone.repoId}`)
		return this.renderResult(
			milestone.title,
			repo ? Renderers.repoName(repo) : '',
			'Filter milestone',
			'milestone',
			isSelected
		)
	}

	renderLabel = (item:SearchItem,label:Label,isSelected) => {
		const {repoModels} = this.props
		const repo = repoModels && repoModels.get(`${label.repoId}`)
		return this.renderResult(
			label.name,
			repo ? Renderers.repoName(repo) : '',
			'Filter label',
			'tag',
			isSelected
		)
	}

	private renderFns = {
		[SearchType.Repo]: this.renderRepo,
		[SearchType.AvailableRepo]: this.renderAvailableRepo,
		[SearchType.Issue]: this.renderIssue,
		[SearchType.Milestone]: this.renderMilestone,
		[SearchType.Label]: this.renderLabel
	}

	/**
	 * Generate the result sections
	 *
	 * @returns {any}
	 */
	prepareResults(props:ISearchResultsListProps) {
		const {onResultHover,onResultSelected,searchItemModels,selectedIndex,results} = props || null


		if (!results)
			return null

		const themeStyles = this.getThemeStyles()

		let itemCounter = -1
		log.debug(`Selected index in results ${selectedIndex}`)

		const rows = _.nilFilter(searchItemModels.map((itemModel,index) => {
			itemCounter++

			const
				{item,model} = itemModel,
				{id,type} = item


			log.info('Item',model.$$clazz,item.type,item)
			const resultRenderer:any = this.renderFns[item.type]


			const isSelected = selectedIndex === itemCounter


			// TODO: caclulate this in the SearchPanel - this is expensive
			// if (isSelected && (_.get(this,'state.selectedItem.item.id',-1) !== item.id))
			// 	this.setState({selectedItem:itemModel})

			const itemContent = resultRenderer(item,model,isSelected)

			if (!itemContent)
				return null

			// Make the row style
			const resultStyle = makeStyle(
				styles.result,
				themeStyles.result.normal,
				isSelected && themeStyles.result.selected
			)

			return (
				<div key={`${item.id}`}
				     className={isSelected && 'selected'}
				     style={resultStyle}
				     onMouseEnter={() => onResultHover && onResultHover(itemModel)}
				     onMouseDown={() => onResultSelected && onResultSelected(itemModel)}

				>
					{itemContent}
				</div>
			)
		}))

		log.debug(`Rendering rows`,rows.length,rows)
		return rows

	}


	renderResults(props) {
		const t = getTheme()
		const {palette:p} = t

		let resultsStyle = makeStyle(styles.results,{
			backgroundColor: p.alternateBgColor,
			color: p.alternateTextColor
		})

		log.debug('rendering results inline:',props.inline,'open',props.open,'anchor',props.anchor)

		if (!props.inline) {
			const anchor = typeof props.anchor === 'string' ?
				document.querySelector(props.anchor) :
				props.anchor


			const containerStyle = props.open && anchor ? (() => {
				const rect =  anchor.getBoundingClientRect()
				const top = (rect.height + rect.top)
				const winHeight = window.innerHeight
				const height = winHeight - top - (winHeight * .1)
				const maxHeight = `${height}px`
				return {
					position: 'absolute',
					display: 'block',
					width: rect.width + 'px',
					top: `${top}px`,
					left: rect.left + 'px',
					height: maxHeight,
					maxHeight,
					overflow: 'auto',
					fontFamily: t.fontFamily,
					fontWidth: t.fontWeight,
					zIndex: 99999
				}
			})() : {
				height: 0
			}

			log.debug('rendering results',{anchor,node:this.node,containerStyle})
			resultsStyle = makeStyle(resultsStyle, props.containerStyle)
			const resultsElement = (<div className="searchResults" style={resultsStyle}>
				<CSSTransitionGroup
					transitionName="results"
					transitionEnterTimeout={250}
					transitionLeaveTimeout={150}>

					{props.open && this.prepareResults(props)}

				</CSSTransitionGroup>
			</div>)

			_.assign(this.node.style, containerStyle)
			ReactDOM.render(resultsElement, this.node)
		} else {
			return <div className={props.className} style={resultsStyle}>
				{props.open && this.prepareResults(props)}
			</div>
		}
		//renderSubtreeIntoContainer(this,resultsElement,this.node)
	}

	render() {
		return (this.props.inline) ?
			this.renderResults(this.props) :
			<div></div>
			// React.DOM.noscript()
	}

}
