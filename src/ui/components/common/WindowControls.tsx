


import { IThemedAttributes, ThemedStyles } from "shared/themes/ThemeDecorations"
import { PureRender } from "ui/components/common"


function baseStyles(topStyles,theme,palette) {

	const
		{primary,accent,text,secondary,background} = palette
	
	return {
		
		controls: [ FlexRowCenter, PositionAbsolute, {
			WebkitAppRegion: 'no-drag',
			top: 17,
			left: 10,
			height: rem(2)
		} ],
		
		control: [ FlexColumnCenter, makeMarginRem(0, 0.5), makeTransition([ 'border', 'color' ]), {
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
	<div style={makeStyle(styles.control,style)} onClick={onClick}>
		<span style={styles.control.icon} className={`fa fa-${iconName}`}/>
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
		
		
		return <div style={styles.controls}>
			<WindowControl styles={styles} iconName='times' onClick={this.close} />
			<WindowControl styles={styles} iconName='minus' onClick={this.minimize} />
			<WindowControl styles={styles} iconName='plus' onClick={this.maximize} />
		</div>
	}
}