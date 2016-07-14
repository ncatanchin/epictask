/**
 * Created by jglanz on 6/13/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Models from 'shared/models'
import {Label} from 'shared/models/Label'
import * as Constants from 'shared/Constants'
const tinycolor = require('tinycolor2')

// Constants
const log = getLogger(__filename)
const baseStyles = {
	root: makeStyle(FlexRow, FlexAuto, {}),
	label: makeStyle({
		display: 'inline-block',
		padding: '0.6rem 1rem',
		borderRadius: '0.3rem',
		fontSize: themeFontSize(1),
		fontWeight: 700,
		margin: '0 1rem 0 0',
		boxShadow: '0.1rem 0.1rem 0.1rem rgba(0,0,0,0.4)'
	})
}


/**
 * Map theme into props - very shorthand
 * @param state
 */
const mapStateToProps = _.memoize((state) => ({theme: getTheme()}))

/**
 * IIssueLabelsProps
 */
export interface IIssueLabelsProps extends React.DOMAttributes {
	theme?:any
	style?:any
	labels?:Label[]
	labelStyle?:any
}

/**
 * IssueLabels
 *
 * @class IssueLabels
 * @constructor
 **/

@connect(mapStateToProps)
export class IssueLabels extends React.Component<IIssueLabelsProps,any> {


	constructor(props = {}) {
		super(props)
	}

	updateState = (props = this.props) => {
		const {theme} = props,
			styles = mergeStyles(baseStyles, theme.labels)

		this.setState({styles})

	}

	componentWillMount = this.updateState
	componentWillReceiveProps = this.updateState

	renderLabels(props) {
		const {theme} = this.props,
			{styles} = this.state

		return _.nilFilter(props.labels).map((label:Label) => {
			const
				p = theme.palette,
				backgroundColor = '#' + label.color,
				labelStyle = makeStyle(styles.label, props.labelStyle, {
					backgroundColor,
					color: tinycolor.mostReadable(backgroundColor,[
						p.text.secondary,
						p.alternateText.secondary
					])
				})
			return <div key={label.url} style={labelStyle}>{label.name}</div>

		})
	}

	render() {
		return <div style={makeStyle(this.state.styles.root,this.props.style)}>
			{this.props.labels && this.renderLabels(this.props)}
		</div>
	}


}