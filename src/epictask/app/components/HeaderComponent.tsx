import * as React from 'react'
import {AuthActionFactory} from '../actions/auth/AuthActionFactory'
import {getStore} from '../store'
import {Themeable} from '../ThemeManager'
import {RepoActionFactory} from '../actions/repo/RepoActionFactory'
import {SearchPanel} from './'

const styles = require('./HeaderComponent.scss')
const log = getLogger(__filename)
const authActions = new AuthActionFactory()
const store = getStore()

const repoActions = new RepoActionFactory()

export interface IHeaderProps {
	className:string
	expanded:boolean
}

/**
 * The app header component, title/logo/settings
 */
@Themeable()
@CSSModules(styles)
export class HeaderComponent extends React.Component<IHeaderProps,any> {

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
		const {expanded} = this.props

		let {logoStyle,style,controlStyle} = theme.navBar
		let logoClazz = styles[expanded ? 'logo-expanded' : 'logo']
		let headerClazz = styles[expanded ? 'header-expanded' : 'header']
		style = Object.assign({},style,{
			height: (expanded) ? '100%' : style.height
		})

		const imgStyle = !expanded ? {} :  {
			maxHeight: '20%',
			maxWidth:  '25%'
		}


		return <div className={`${styles.header + ' ' + this.props.className}`} style={style}>
			<div styleName='window-controls'>
				<button className="close fa fa-times" style={controlStyle} onClick={this.windowClose} />
				<button className="min fa fa-minus" style={controlStyle} onClick={this.windowMin}/>
				<button className="max fa fa-plus" style={controlStyle} onClick={this.windowMax}/>
			</div>
			<SearchPanel inlineResults={expanded} expanded={expanded}/>
			<div  className={logoClazz} style={logoStyle}>
				{/*<img style={imgStyle} src={require('assets/images/epictask-logo.png')}/>*/}
			</div>

		</div>
	}
}


