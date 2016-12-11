// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components/common'
import { IThemedAttributes, ThemedStyles } from 'epic-styles'


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ FlexColumn, FlexAuto, {} ]
}


/**
 * IKeyMapEditorProps
 */
export interface IKeyMapEditorProps extends IThemedAttributes {
	
}

/**
 * IKeyMapEditorState
 */
export interface IKeyMapEditorState {
	
}

/**
 * KeyMapEditor
 *
 * @class KeyMapEditor
 * @constructor
 **/

@connect(createStructuredSelector({
	// Props mapping go here, use selectors
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class KeyMapEditor extends React.Component<IKeyMapEditorProps,IKeyMapEditorState> {
	
	render() {
		const { styles } = this.props
		
		return <div style={styles.root}>
		</div>
	}
	
}


