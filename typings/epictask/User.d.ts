
/**
 * User model from GitHub schema
 */

declare interface IUser {
	
	id: number;
	
	login: string;
	
	repoIds: number[]
	
	
	name:string
	
	avatar_url: string;
	
	gravatar_id: string;
	
	url: string;
	
	type: string;
	
	site_admin: boolean;
	
}
