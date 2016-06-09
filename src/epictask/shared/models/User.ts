import {
	ModelDescriptor,
	AttributeDescriptor,
	FinderDescriptor,
	DefaultModel,
	DefaultValue,
	Repo as TSRepo
} from 'typestore'

import {IndexedDBFinderDescriptor} from 'typestore-plugin-indexeddb'

@ModelDescriptor()
export class User extends DefaultModel {


	@AttributeDescriptor({primaryKey:true})
	id: number;

	@AttributeDescriptor()
	login: string;


	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;

	constructor(props = {}) {
		super()
		Object.assign(this,props)
	}


}