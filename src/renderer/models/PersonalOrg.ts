import {IOrg} from "renderer/models/Org"

export default function getPersonalOrg():IOrg | null {
	const {user} = getStoreState().AppState
	return !user ? null : Object.assign({}, user,{
		personal: true
	}) as any
}
