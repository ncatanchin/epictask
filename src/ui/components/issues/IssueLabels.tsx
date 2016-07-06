/**
 * Created by jglanz on 6/13/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Models from 'shared/models'
import * as Constants from 'shared/Constants'
const tinycolor = require('tinycolor2')

// Constants
const log = getLogger(__filename)
const styles = {
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
const mapStateToProps = (state) => ({theme: getTheme()})

/**
 * IIssueLabelsProps
 */
export interface IIssueLabelsProps extends React.DOMAttributes {
	theme?:any
	style?:any
	labels?:Models.Label[]
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


	renderLabels(props,theme,s) {
		return props.labels.map(label => {

			const
				p = theme.palette,
				backgroundColor = '#' + label.color,
				labelStyle = makeStyle(s.label, props.labelStyle, {
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
		const
			{props} = this,
			{theme} = props,
			s = mergeStyles(styles, theme.labels)

		return <div style={makeStyle(s.root,props.style)}>
			{props.labels && this.renderLabels(props,theme,s)}
		</div>
	}

}