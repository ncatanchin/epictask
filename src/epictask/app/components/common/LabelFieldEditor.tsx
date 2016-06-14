/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {Issue,Label,AvailableRepo} from 'shared/models'
import * as Constants from 'shared/Constants'
import {PureRender} from 'components/common'
import {ChipsField} from './ChipsField'

// Constants
const log = getLogger(__filename)
const styles = {
	root: makeStyle(FlexColumn, FlexAuto, {})
}


function mapStateToProps(state) {
	const appState = state.get(Constants.AppKey)
	return {
		theme: appState.theme
	}
}

/**
 * ILabelFieldEditorProps
 */
export interface ILabelFieldEditorProps extends React.DOMAttributes {
	theme?:any
	labels:Label[]
	availableLabels:Label[]
	onLabelsChanged:(newLabels:Label[]) => void
}

/**
 * LabelFieldEditor
 *
 * @class LabelFieldEditor
 * @constructor
 **/

@connect(mapStateToProps)
@Radium
@PureRender
export class LabelFieldEditor extends React.Component<ILabelFieldEditorProps,any> {


	constructor(props, context) {
		super(props, context)
	}

	chipDataSource = (query) => {
		query = _.toLower(query)

		const {availableLabels,labels} = this.props

		function testQuery(name:string) {
			return !query || query.length === 0 ||
				_(name).toLower().startsWith(query)

		}

		function testAvailRepo(availLabel:Label) {
			const selected = !_.isNil(labels.find(label => label.url === availLabel.url))
			return !selected && testQuery(availLabel.name)
		}


		const results = availableLabels.filter(testAvailRepo)
		log.info('return available labels', results)
		return results

	}

	onChipSelected = (newLabel) => {

	}
	chipFilter = (item:Label,query:string):boolean =>  {
		return _(item.name).toLower().startsWith(_.toLower(query))
	}

	render() {
		let
			{theme,availableLabels,labels} = this.props,
			s = mergeStyles(styles, theme.component)

		availableLabels =  availableLabels || []
		labels = labels || []

		return <ChipsField  style={s.root}
		                    modelType={Label}
		                    filterChip={this.chipFilter}
		                    allChips={availableLabels}
		                    selectedChips={labels}
		                    onChipSelected={this.onChipSelected}
		                    keySource={(item:Label) => item.url}>
		</ChipsField>
	}

}