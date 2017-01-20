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
	pluginDirectories?: string[]
}


declare type ISettings = ISettingsProps & Map<string,any>