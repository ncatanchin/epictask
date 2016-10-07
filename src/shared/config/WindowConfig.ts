
const iconPath = 'build/icon.png'

export const WindowIconPath = iconPath
	//(!Env.isDev ? 'resources/' : '') + iconPath

/**
 * Global common window defaults
 */
export const
	AllWindowDefaults = Object.assign({
		show: false,
		frame: false,
		acceptFirstMouse: true,
		title: 'epictask',
		webPreferences: {
			
		}
	},Env.isLinux && {
			icon: WindowIconPath
		}) as any

