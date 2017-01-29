///<reference path="User.d.ts"/>

declare interface ISettingsProps {
	
	/**
	 * User object
	 */
	user?:IUser
	
	/**
	 * Github token
	 */
	token?:string
	
	
	/**
	 * Dropbox token
	 */
	dropboxToken?:string
	
	/**
	 * Native notifications enabled
	 */
	nativeNotificationsEnabled?: boolean
	
	/**
	 * theme name
	 */
	themeName?: string
	
	/**
	 * palette name
	 */
	paletteName?: string
	
	/**
	 * All plugin directories currently configured
	 */
	pluginStores?: string[]
	
	/**
	 * Plugins enabled/disabled status
	 */
	pluginsEnabled?: {[name:string]:boolean}
}


declare type ISettings = ISettingsProps & Map<string,any>