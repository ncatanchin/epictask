/**
 * Created by jglanz on 6/13/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import {User} from 'shared/models'
import {AppKey} from 'shared/Constants'

// Constants
const log = getLogger(__filename)
const styles = {
	root: makeStyle(FlexAuto,FlexRowCenter,Ellipsis,{
		fontSize: themeFontSize(1)

	}),

	avatar: makeStyle({
		backgroundRepeat: 'no-repeat',
		backgroundSize: '100%',
		width: 25,
		height: 25,
		borderRadius: '10%',
		border: '0.2rem solid transparent',
		margin: '0 0 0 0',

		labelBefore: {
			margin: '0 0 0 1rem',
		},
		labelAfter: {
			margin: '0 1rem 0 0',
		}
	}),


	label: makeStyle({
		padding: '0 0 0 0'
	})
}

/**
 * IAvatarProps
 */
export interface IAvatarProps extends React.DOMAttributes {
	user:User
	labelPlacement?:'none'|'before'|'after'
	labelStyle?:any
	avatarStyle?:any
	style?:any
	theme?:any
	prefix?:string
	prefixStyle?:any
}


function mapStateToProps(state) {
	const appState = state.get(AppKey)
	return {
		theme: appState.theme
	}
}

/**
 * Avatar
 *
 * @class Avatar
 * @constructor
 **/
@connect(mapStateToProps)
export class Avatar extends React.Component<IAvatarProps,any> {


	constructor(props) {
		super(props)
	}


	render() {
		const
			{props} = this,
			{theme,user,labelPlacement} = props,
			s = mergeStyles(styles,theme.avatar),
			isBefore = labelPlacement === 'before',
			isAfter = labelPlacement === 'after',
			isNone = labelPlacement === 'none'

		const prefix = <div style={makeStyle(s.prefix,props.prefixStyle)}>{(props.prefix) ? ' ' + props.prefix : ''}</div>
		const usernameLabel = <div style={makeStyle(s.label,props.labelStyle)}>{user ? user.login : 'unassigned'}</div>

		const avatarStyle = makeStyle(
			s.avatar,
			props.avatarStyle,
			user && {backgroundImage: `url(${user.avatar_url})`},
			(isBefore) ? s.avatar.labelBefore :
				(isAfter) ? s.avatar.labelAfter :
				{}
		)

		return <div style={makeStyle(s.root,props.style)}>
			{prefix}
			{isBefore && usernameLabel}
			{user && <div style={avatarStyle}></div>}
			{isAfter && usernameLabel}
		</div>
	}

}