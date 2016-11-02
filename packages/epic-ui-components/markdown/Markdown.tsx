/**
 * Created by jglanz on 6/13/16.
 */

// Imports
import {ThemedNoRadium} from "epic-styles"
import { IThemedAttributes } from "epic-styles"

const PureRenderMixin = require('react-addons-pure-render-mixin')
const ReactMarkdown = require('react-markdown')
const hljs = require('highlight.js')

// Constants
const log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => ({
	root: makeStyle(FlexColumn, FlexAuto, {})
})

/**
 * Map theme into props - very shorthand
 * @param state
 */

const CodeBlock = React.createClass({
	displayName: 'CodeBlock',
	mixins: [PureRenderMixin],
	propTypes: {
		literal: React.PropTypes.string,
		language: React.PropTypes.string
	},

	componentDidMount: function() {
		this.highlightCode();
	},

	componentDidUpdate: function() {
		this.highlightCode();
	},

	highlightCode: function() {
		hljs.highlightBlock(this.refs.code);
	},

	render: function() {
		return (
			<pre>
                <code ref="code" className={this.props.language}>{this.props.literal}</code>
            </pre>
		);
	}
})

/**
 * IMarkdownProps
 */
export interface IMarkdownProps extends IThemedAttributes {
	source?:any
	className?:string
	style?:any
}

/**
 * Markdown
 *
 * @class Markdown
 * @constructor
 **/

@ThemedNoRadium
export class Markdown extends React.Component<IMarkdownProps,any> {


	constructor(props) {
		super(props)
	}


	render() {
		const
			{theme,styles} = this.props,
			s = mergeStyles(styles, theme.component)

		return <ReactMarkdown {...this.props}
			renderers={Object.assign({},ReactMarkdown.renderers,{CodeBlock})}
		/>
	}

}