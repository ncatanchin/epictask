
import {PersistentValue} from './PersistentValue'
import {SettingKeys, SettingDefaults } from "./Constants"

export const
	NativeNotificationsEnabled = new PersistentValue<boolean>(
		SettingKeys.NativeNotifications,
		SettingDefaults[SettingKeys.NativeNotifications],
		(val) => val ? 'true' : 'false',
		(raw) => ['true','1','yes'].includes(raw)
	)
