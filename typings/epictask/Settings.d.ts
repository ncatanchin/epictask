///<reference path="CommonTypes.d.ts"/>
///<reference path="User.d.ts"/>

declare interface ISettingsProps {
	user?:IUser
	token?:string
	
	nativeNotificationsEnabled?: boolean
	themeName?: string
	paletteName?: string
}


declare type ISettings = ISettingsProps & Map<string,any>