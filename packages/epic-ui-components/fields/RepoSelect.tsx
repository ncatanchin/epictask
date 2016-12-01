// Imports

import { connect } from 'react-redux'
import { List } from 'immutable'
import { Avatar, PureRender, RepoLabel } from "../common"

import { createStructuredSelector } from 'reselect'
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { Repo, AvailableRepo } from "epic-models"
import {createSelector} from 'reselect'

import { SelectField } from "./SelectField"
import { shallowEquals } from  "epic-global"
import filterProps from 'react-valid-props'
import { getValue } from "typeguard"
import { availableReposSelector } from "epic-typedux/selectors"

// Constants
const log = getLogger(__filename)

const baseStyles = (topStyles, theme, palette) => ({
	// root: [ FlexColumn, FlexAuto, {} ],
	//
	// avatar: [ FlexRow, makeFlexAlign('center', 'flex-start'), {
	// 	height: rem(3),
	//	
	// 	label: {
	// 		fontWeight: 500,
	// 	},
	// 	image: {
	// 		height: rem(2.2),
	// 		width: rem(2.2),
	// 	}
	//	
	// } ]
})


/**
 * IMilestoneSelectProps
 */
export interface IRepoSelectProps extends IThemedAttributes {
	
	labelStyle?: any
	
	repos?: List<AvailableRepo>
	
	repo: AvailableRepo
	
	onItemSelected: (repo: AvailableRepo) => any
	
}

/**
 * IMilestoneSelectState
 */
export interface IRepoSelectState {
	items:ISelectFieldItem[]
}

/**
 * MilestoneSelect
 *
 * @class MilestoneSelect
 * @constructor
 **/

@connect(() => {
	const
		reposSelector = createSelector(
			availableReposSelector,
			(state,props) => props.repos,
			(allRepos,propRepos) => propRepos || allRepos
		)
	return createStructuredSelector({
		repos: reposSelector
	})
})

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles, 'dialog')
@PureRender
export class RepoSelect extends React.Component<IRepoSelectProps,IRepoSelectState> {
	
	
	static defaultProps = {}
	
	
	/**
	 * Create menu items
	 *
	 * @param props
	 * @returns {any[]}
	 */
	makeItems(props = this.props) {
		
		const
			{
				styles,
				repos
			} = props
			
			// MAP ITEMS
		return repos
				.map(repo => ({
					key: repo.id,
					value: repo,
					content: <RepoLabel repo={repo.repo}/>,
					contentText: repo.repo.full_name
				})).toArray()
		
		
	}
	
	/**
	 * Create items and required elements
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		this.setState({
			items: this.makeItems(props)
			
		})
	}
	
	/**
	 * On change, notify
	 *
	 * @param item
	 */
	private onItemSelected = (item: ISelectFieldItem) => {
		this.props.onItemSelected(item && item.value as AvailableRepo)
	}
	
	/**
	 * On mount always create items
	 */
	componentWillMount = this.updateState
	
	/**
	 * On new props - update items if required
	 *
	 * @param nextProps
	 * @param nextContext
	 */
	componentWillReceiveProps(nextProps: IRepoSelectProps, nextContext: any): void {
		if (!shallowEquals(this.props, nextProps, 'repos', 'repo'))
			this.updateState(nextProps)
	}
	
	/**
	 * Render the select
	 *
	 * @returns {any}
	 */
	render() {
		const
			{ labelStyle, theme, styles, repos, repo } = this.props,
			{items} = this.state,
			
			// GET SELECTED ITEM AS VALUE
			value = repo && items.find(item =>
				item.key === getValue(() => repo.id))
		
		
		//labelStyle={styles.form.repo.item.label}
		return <SelectField
			{...filterProps(this.props)}
			value={value}
			items={items}
			onItemSelected={this.onItemSelected}
		/>
	}
	
}