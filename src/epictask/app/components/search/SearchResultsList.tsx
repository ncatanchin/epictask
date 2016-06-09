/**
 * Created by jglanz on 6/4/16.
 */

// Imports
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'
import {isIssue,Repo,AvailableRepo} from 'shared/models'
import {SearchResults, SearchResult, SearchResultType} from 'app/actions/search/SearchState'
import {BaseThemedComponent, IThemedState} from 'app/ThemeManager'
import {makeStyle,rem,FlexRow,FontBlack,
	FlexRowCenter,FlexScale,FlexAuto,makeFlexAlign,
	Ellipsis,FlexColumnCenter,makeTransition} from 'app/themes'
import {Issue} from 'shared/models'
import {RepoActionFactory} from 'app/actions/repo/RepoActionFactory'
import {Renderers} from 'app/components'
import * as Radium from 'radium'

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

	result: makeStyle(makeTransition(),FlexRowCenter,{
		padding: `1rem 1rem`,
		cursor: 'pointer'
	}),

	resultInfo: makeStyle(FlexColumnCenter,makeFlexAlign('stretch','center'),{
			paddingRight: '2rem'
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
	containerStyle?:any
	inline?: boolean
	open:boolean
	selectedIndex?:number
	className?:string
	results?:SearchResults
	onResultSelected?:(result:SearchResult<any>) => void
	onResultHover?:(result:SearchResult<any>) => void
}

/**
 * SearchResults
 *
 * @class SearchResults
 * @constructor
 **/
@Radium
export class SearchResultsList extends BaseThemedComponent<ISearchResultsListProps,IThemedState> {

	static getInitialState() {
		return {}
	}

	/**
	 * Mount node for search results
	 */
	node:HTMLElement

	constructor(props,context) {
		super(props,context)
	}



	componentDidMount():void {
		super.componentDidMount()

		this.node = doc.createElement('div')
		_.assign(this.node.style, styles.resultsModal)

		body.appendChild(this.node)
		this.renderResults(this.props)
	}

	componentWillReceiveProps(nextProps:ISearchResultsListProps, nextContext:any):void {
		if (!nextProps.inline)
			this.renderResults(nextProps)
	}

	componentWillUnmount():void {
		super.componentWillUnmount()

		ReactDOM.unmountComponentAtNode(this.node)
		body.removeChild(this.node)
		// elementClass(body).remove(styleVisible)
	}

	getThemeStyles() {
		return this.state.theme.searchResults
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
			<div style={makeStyle(typeStyle,styles.padded)}>
				{typeLabel}
			</div>
		</div>
	}

	renderRepo(repoResult:SearchResult<Repo>,isSelected) {
		const repo = repoResult.value

		return this.renderResult(
			Renderers.repoName(repo),
			`${repo.open_issues_count} open issues`,
			'Add issue repo','repo',
			isSelected)
	}

	/**
	 * Render an available repo, once allready initialized
	 *
	 * @param availRepoResult
	 * @param isSelected
	 * @returns {any}
	 */
	renderAvailableRepo(availRepoResult:SearchResult<AvailableRepo>,isSelected) {
		const
			// Get data
			availRepo = availRepoResult.value,
			availRepoSelected = availRepo.enabled,
			repo = availRepo.repo || repoActions.state.repos.find(item => item.id === availRepo.repoId)

		// The wrapper element with content inside
		// Row 1: label
		// Row 2: possible action
		return this.renderResult(
			Renderers.repoName(repo),
			`${repo.open_issues_count} open issues`,
			(availRepoSelected) ? 'Hide issues' : 'Show Issues',
			'repo',
			isSelected)


	}

	renderIssue(repoResult:SearchResult<Issue>,isSelected) {
		return []
	}


	/**
	 * Generate the result sections
	 *
	 * @returns {any}
	 */
	prepareResults(props) {
		const results = props.results || null
		if (!results)
			return undefined

		const themeStyles = this.getThemeStyles()

		// Props
		const {onResultHover,onResultSelected,selectedIndex} = props

		// Map Result types
		const types = Object.keys(SearchResultType)
			.filter(t => _.isFinite(_.toNumber(t)))
			.map(t => _.toNumber(t))

		let rows = []

		log.info(`Selected index in results ${selectedIndex}`)

		// Iterate result types and build sections
		types.forEach(type => {

			const sectionResults = results.all.filter(result => result.type === type)

			rows = rows.concat(sectionResults.map(result => {
				const isSelected = selectedIndex === result.index
				const resultContent = (result.type === SearchResultType.Repo) ? this.renderRepo(result,isSelected) :
					(result.type === SearchResultType.Issue) ? this.renderIssue(result,isSelected) :
						this.renderAvailableRepo(result,isSelected)

				// Make the row style
				const resultStyle = makeStyle(
					styles.result,
					themeStyles.result.normal,
					isSelected && themeStyles.result.selected
				)

				return (
					<div key={result.value.id}
					     className={isSelected && 'selected'}
					     style={resultStyle}
					     onMouseEnter={() => onResultHover && onResultHover(result)}
					     onClick={() => onResultSelected && onResultSelected(result)}
					>
						{resultContent}
					</div>
				)
			}))

		})

		return rows
	}


	renderResults(props) {
		const t = getTheme()
		const {palette:p} = t

		let resultsStyle = makeStyle(styles.results,{
			backgroundColor: p.alternateBgColor,
			color: p.alternateTextColor
		})




		if (!this.props.inline) {
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


			resultsStyle = makeStyle(resultsStyle, props.containerStyle)
			const resultsElement = (<div style={resultsStyle}>
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
			React.DOM.noscript()
	}

}
