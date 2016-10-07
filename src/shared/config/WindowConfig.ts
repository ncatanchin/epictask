
const
	dataUrl = require('dataurl'),
	iconRawData = require('!!raw!../../../build/icon.png'),
	iconPath = 'build/icon.png',
	{nativeImage} = require('electron'),
	iconUrl = dataUrl.format({
		mimetype:'image/png',
		data:iconRawData
	})

export const WindowIcon = nativeImage.createFromDataURL(iconUrl)
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
			icon: WindowIcon
		}) as any

