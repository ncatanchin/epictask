/**
 * Created by jglanz on 6/13/16.
 */

// Imports
import * as React from 'react'
import { User } from 'shared/models'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import * as Radium from 'radium'
import { Icon } from 'ui/components/common'
import PureRender from "ui/components/common/PureRender"
import filterProps from 'react-valid-props'

// Constants
const log = getLogger(__filename)
const baseStyles = (topStyles,theme,palette) => ({
	root: [ FlexAuto, FlexRowCenter, Ellipsis, PositionRelative, {
		fontSize: themeFontSize(1),
		clickable: [
			makeTransition('background-color'),
			CursorPointer,
			makePaddingRem(0.3, 0.5), {
				borderRadius: rem(0.2)
			} ],
		':hover': {}
	} ],
	
	
	// Accessories
	accessory: [ FlexAuto, FlexRowCenter, {
		height: "100%",
		
		// icon decoration
		icon: [ makePaddingRem(0.6), {
			fontSize: themeFontSize(1),
			lineHeight: 1
		} ],
		
		right: [ PositionAbsolute, {
			right: 0,
			top: 0,
			bottom: 0
		} ],
		
		left: [ PositionAbsolute, {
			left: 0,
			top: 0,
			bottom: 0
		} ],
		
		// remove control
		remove: [ makeTransition([ 'opacity', 'width', 'padding', 'background-color', 'color' ]), makePaddingRem(0), OverflowHidden, {
			fontSize: themeFontSize(1),
			cursor: 'pointer',
			lineHeight: 1,
			display: 'block',
			opacity: 0,
			width: 0,
			maxWidth: 0,
			
			hover: [ makePaddingRem(0.6), {
				width: 'auto',
				maxWidth: 'none',
				opacity: 1
			} ]
		} ]
		
		
	} ],
	
	avatar: [ makeMarginRem(0), {
		backgroundRepeat: 'no-repeat',
		backgroundSize: '100%',
		width: 25,
		height: 25,
		borderRadius: '10%',
		borderWidth: '0.2rem',
		borderStyle: 'solid',
		borderColor: 'transparent',
		
		
		labelBefore: [ makeMarginRem(0, 0, 0, 1), {} ],
		labelAfter: [ makeMarginRem(0, 1, 0, 0), {} ],
	} ],
	
	
	label: [ makePaddingRem(0), {} ]
})

/**
 * IAvatarProps
 */
export interface IAvatarProps extends React.HTMLAttributes<any> {
	user:User
	onRemove?:(user?:User) => void
	labelPlacement?:'none'|'before'|'after'
	labelStyle?:any
	labelTextFn?:(user?:User) => string|any
	avatarStyle?:any
	style?:any
	styles?:any
	theme?:any
	prefix?:string
	prefixStyle?:any
}


/**
 * Avatar
 *
 * @class Avatar
 * @constructor
 **/
@ThemedStyles(baseStyles, 'avatar')
@PureRender
export class Avatar extends React.Component<IAvatarProps,any> {
	
	render() {
		const
			{ props } = this,
			{ styles, labelTextFn, theme, onRemove, onClick, user, labelPlacement } = props,
			{ palette } = theme,
			
			isBefore = labelPlacement === 'before',
			isAfter = labelPlacement === 'after',
			isNone = labelPlacement === 'none',
			hovering = Radium.getState(this.state, 'avatar', ':hover')
		
		const prefix = <div
			style={makeStyle(styles.prefix,props.prefixStyle)}>{(props.prefix) ? ' ' + props.prefix : ''}</div>
		
		const usernameLabel = <div style={makeStyle(styles.label,props.labelStyle)}>
			{user ?
				(labelTextFn ? labelTextFn(user) :
					user.name ? `${user.name} <${user.login}>` :
						user.login) :
				'unassigned'}
		</div>
		
		const
			avatarStyle = makeStyle(
				styles.avatar,
				props.avatarStyle,
				user && { backgroundImage: `url(${user.avatar_url})` },
				(isBefore) ? styles.avatar.labelBefore :
					(isAfter) ? styles.avatar.labelAfter :
					{}
			)
		
		return <div
			{...filterProps(this.props)}
			ref='avatar'
			style={[
						styles.root,
						onClick && styles.root.clickable,
						props.style
					]}
			onClick={onClick}>
			{prefix}
			{isBefore && usernameLabel}
			{user && <div style={avatarStyle}></div>}
			{isAfter && usernameLabel}
			{onRemove &&
			<div style={[
					styles.accessory,styles.accessory.left,
					hovering && {backgroundColor: palette.errorColor}
				]} className="removeControl">
				<Icon
					style={[
								styles.accessory.remove,
								hovering && styles.accessory.remove.hover,
								hovering && {color:palette.textColor}
							]}
					onClick={(event) => (onRemove(user),
							event.stopPropagation(),event.preventDefault())}
					iconSet='fa'
					iconName='times'/>
			</div>}
		</div>
	}
	
}