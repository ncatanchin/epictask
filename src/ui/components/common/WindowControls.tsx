


import { IThemedAttributes, ThemedStyles } from "shared/themes/ThemeDecorations"
import { PureRender } from "ui/components/common"


function baseStyles(topStyles,theme,palette) {

	const
		{primary,accent,text,secondary,background} = palette
	
	return {
		header: [ FlexRowCenter, FlexAuto, PositionRelative, makeTransition(), {
			WebkitUserSelect: 'none',
			WebkitAppRegion: 'drag',
			opacity: 0,
			height: 0,
			padding: 0,
			border: 0,
		} ],
		
		headerNormal: {
			padding: '0.3rem 10rem',
			opacity: 1
		},
		
		headerExpanded: makeStyle({
			height: '100vh',
			maxHeight: '100vh',
			flexBasis: '100vh',
			flexGrow: 1,
			flexShrink: 0
		}),
		
		windowControls: [ FlexRowCenter, PositionAbsolute, {
			WebkitAppRegion: 'no-drag',
			top: 17,
			left: 10,
			height: rem(2)
		} ],
		
		windowControl: [ FlexColumnCenter, makeMarginRem(0, 0.5), makeTransition([ 'border', 'color' ]), {
			width: rem(1.5),
			height: rem(1.5),
			cursor: 'pointer',
			borderRadius: '50%',
			border: `0.2rem solid ${primary.hue2}`,
			color: Transparent,
			background: Transparent,
			
			[CSSHoverState]: [ {
				border: `0.1rem solid transparent`,
				background: primary.hue2,
				color: text.primary
			} ],
			
			icon: [ {
				fontSize: rem(0.9)
			} ]
		} ]
	}
}

const WindowControl = Radium(({styles,style,iconName,onClick}) =>
	<div style={makeStyle(styles.windowControl,style)} onClick={onClick}>
		<span style={styles.windowControl.icon} className={`fa fa-${iconName}`}/>
	</div>

)


function getWindow():Electron.BrowserWindow {
	return require('electron').remote.getCurrentWindow()
}

@ThemedStyles(baseStyles)
@PureRender
export class WindowControls extends React.Component<IThemedAttributes,void> {
	
	/**
	 * Close window
	 */
	private close = () => getWindow() && getWindow().close()
	
	/**
	 * Max/un-max window
	 */
	private maximize = () => {
		const
			win = getWindow()
		
		if (!win)
			return
		
		if (win.isMaximized())
			win.unmaximize()
		else
			win.maximize()
	}
	
	/**
	 * Minimize/Un-minimize window
	 */
	private minimize = () => {
		const
			win = getWindow()
		
		if (!win)
			return
		
		if (win.isMinimized())
			win.restore()
		else
			win.minimize()
	}
	
	render() {
		
		const
			{styles} = this.props
		
		
		return <div style={styles.windowControls}>
			<WindowControl styles={styles} iconName='times' onClick={this.close} />
			<WindowControl styles={styles} iconName='minus' onClick={this.minimize} />
			<WindowControl styles={styles} iconName='plus' onClick={this.maximize} />
		</div>
	}
}