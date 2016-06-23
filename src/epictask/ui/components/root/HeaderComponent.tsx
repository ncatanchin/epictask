import * as React from 'react'
import {AuthActionFactory} from 'shared/actions/auth/AuthActionFactory'
import {getStore} from 'shared/store'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {SearchPanel} from 'components'
import {makeAbsolute} from '../../../shared/themes/styles/CommonStyles'


//const styles = require('./HeaderComponent.scss')
const log = getLogger(__filename)
const authActions = new AuthActionFactory()
const store = getStore()

const repoActions = new RepoActionFactory()

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

	logo: makeStyle(makeTransition(), PositionAbsolute, {
		right:              0,
		top:                0,
		width:              '8rem',
		maxWidth:           '100%',
		height:             '100%',
		padding:            '0.2rem 1rem',
		//backgroundImage:    `url(${require('assets/images/epictask-logo.png')})`,
		backgroundImage:    `url(${require('assets/images/densebrain-logo-2.png')})`,
		backgroundSize:     '70%',
		backgroundPosition: 'center',
		backgroundOrigin:   'content-box',
		backgroundRepeat:   'no-repeat'
	}),

	logoExpanded: makeStyle(makeAbsolute(0, 0), {
		padding:            '10rem 10rem 4rem 10rem',
		height:             '50%',
		width:              '100%',
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
		const logoStyle = makeStyle(
			theme.header.logoStyle,
			styles.logo,
			{
				height: themeHeight
			},
			expanded && styles.logoExpanded)

		let headerStyle = makeStyle(styles.header)

		if ((visibility !== HeaderVisibility.Hidden)) {
			headerStyle = makeStyle(
				theme.header.style,
				style,
				styles.header,
				styles.headerNormal,
				expanded && styles.headerExpanded,
				{
					height:          (visibility === HeaderVisibility.Expanded) ? '100%' :
						                 themeHeight,
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
			<div style={logoStyle}>
				{/*<img style={imgStyle} src={require('assets/images/epictask-logo.png')}/>*/}
			</div>

		</div>
	}
}


