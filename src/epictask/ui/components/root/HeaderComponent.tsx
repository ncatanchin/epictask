import * as React from 'react'
import {SearchPanel} from 'components'
import {makeAbsolute} from 'shared/themes/styles/CommonStyles'

const log = getLogger(__filename)

export enum HeaderVisibility {
	Hidden,
	Normal,
	Expanded
}

const styles = {
	header: makeStyle(FlexRow, FlexAlignCenter, FlexAuto, PositionRelative, makeTransition(), {
		WebkitUserSelect: 'none',
		WebkitAppRegion:  'drag',
		opacity:          0,
		height:           0,
		padding:          0,
		border:           0,
	}),

	headerNormal: {
		padding: '0.3rem 10rem',
		opacity: 1
	},

	headerExpanded: makeStyle({
		height:     '100vh',
		maxHeight:  '100vh',
		flexBasis:  '100vh',
		flexGrow:   1,
		flexShrink: 0
	}),

	controls: makeStyle(makeAbsolute(), {
		opacity: 1,
		border:  '0.2rem solid transparent',
		padding: 0
	}),

	controlButton: makeStyle(makeTransition(), FlexRowCenter, {
		display: 'inline-flex',
		border:  '0.2rem solid transparent'
	}),

	controlButtonBefore: makeStyle(makeTransition()),

	logoWrapper: makeStyle(makeTransition(), PositionAbsolute, {
		right:              0,
		top:                0,
		width:              'auto',
		padding:            '0.2rem 1rem',


	}),

	logo: makeStyle(makeTransition(), PositionAbsolute, {
		top:'50%',
		left:'50%',

		height:             '70%',
		width:              'auto',
		maxWidth:           '70%',


		transform:          'translate(-50%,-50%)'

	}),

	logoExpanded: makeStyle({
		top:'50%',
		left:'50%',
		height:             '80%',
		width:              'auto',
		maxWidth:           '80%',
		transform:          'translate(-50%,-50%)'
	}),

	logoWrapperExpanded: makeStyle({
		top: '25%',
		left: '50%',
		right: 'inherit',
		transform:          'translate(-50%,-50%)',
		padding:            '10rem 10rem 4rem 10rem',
		height:             '50%',
		width:              '50%',
		backgroundSize:     '40%',
		backgroundPosition: 'bottom center'
	})

}


export interface IHeaderProps {
	className?:string
	visibility:HeaderVisibility
	style?:any
}

/**
 * The app header component, title/logo/settings
 */
// @Themeable()
export class Header extends React.Component<IHeaderProps,any> {

	/**
	 * Create a new header component
	 *
	 * @param props
	 * @param context
	 */
	constructor(props, context) {
		super(props, context)
	}

	windowClose = () => {
		log.info('window close')
	}

	windowMin = () => {
		log.info('window min')
	}

	windowMax = () => {
		log.info('window max')
	}


	render() {
		const theme = getTheme()
		const
			{visibility, style} = this.props,
			expanded = visibility === HeaderVisibility.Expanded

		const themeHeight = theme.header.style.height
		const logoWrapperStyle = makeStyle(
			styles.logoWrapper,
			theme.header.logoWrapperStyle,
			{
				height: themeHeight,
				width: themeHeight,
				right: themeHeight / 2
			},
			expanded && styles.logoWrapperExpanded)

		const logoStyle = makeStyle(
			styles.logo,
			theme.header.logo,
			expanded && styles.logoExpanded
		)

		let headerStyle = makeStyle(styles.header)

		if ((visibility !== HeaderVisibility.Hidden)) {
			headerStyle = makeStyle(
				theme.header.style,
				style,
				styles.header,
				styles.headerNormal,
				expanded && styles.headerExpanded, {
					height: (visibility === HeaderVisibility.Expanded) ? '100%' : themeHeight,
					WebkitAppRegion: 'drag'
				}
			)
		}

		const controlStyle = makeStyle(theme.header.controlStyle,styles.controlButton)

		return <div style={headerStyle} id='header'>
			{/*<div style={styles.controls} className='window-controls'>*/}
				{/*<button className="close fa fa-times" style={controlStyle} onClick={this.windowClose}/>*/}
				{/*<button className="min fa fa-minus" style={controlStyle} onClick={this.windowMin}/>*/}
				{/*<button className="max fa fa-plus" style={controlStyle} onClick={this.windowMax}/>*/}
			{/*</div>*/}
			<SearchPanel inlineResults={expanded} expanded={expanded}/>
			<div style={logoWrapperStyle}>
				<img style={logoStyle} src={require('assets/images/epictask-logo-rainbow.png')}/>
				{/*<img style={imgStyle} src={require('assets/images/epictask-logo.png')}/>*/}
			</div>

		</div>
	}
}


