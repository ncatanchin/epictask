declare interface IRepo {
	id: number
	
	/**
	 * Organization owner if not individual
	 */
	
	organization: IUser
	
	/**
	 * Individual owner
	 */
	
	owner: IUser
	
	name: string;
	
	
	full_name: string;
	
	
	description: string;
	
	fork: boolean;
	
	url: string;
	
	homepage: string;
	
	language: any;
	
	forks_count: number;
	
	stargazers_count: number;
	
	watchers_count: number;
	
	
	size: number;
	
	default_branch: string;
	
	open_issues_count: number;
	
	has_issues: boolean;
	
	has_wiki: boolean;
	
	has_pages: boolean;
	
	has_downloads: boolean;
	
	
	pushed_at: string;
	
	
	created_at: string;
	
	
	updated_at: string;
	
	
	permissions: IPermission;
}
