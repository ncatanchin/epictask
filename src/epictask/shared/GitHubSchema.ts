
export interface User {
	login?: string;
	id?: number;
	avatar_url?: string;
	gravatar_id?: string;
	url?: string;
	html_url?: string;
	followers_url?: string;
	following_url?: string;
	gists_url?: string;
	starred_url?: string;
	subscriptions_url?: string;
	organizations_url?: string;
	repos_url?: string;
	events_url?: string;
	received_events_url?: string;
	type?: string;
	site_admin?: boolean;
}

export interface Label {
	url?: string;
	name?: string;
	color?: string;
}

export interface Milestone {
	url?: string;
	html_url?: string;
	labels_url?: string;
	id?: number;
	number?: number;
	state?: string;
	title?: string;
	description?: string;
	creator?: User;
	open_issues?: number;
	closed_issues?: number;
	created_at?: Date;
	updated_at?: Date;
	closed_at?: Date;
	due_on?: Date;
}

export interface PullRequest {
	url?: string;
	html_url?: string;
	diff_url?: string;
	patch_url?: string;
}



export interface Issue {
	id?: number;
	url?: string;
	repository_url?: string;
	labels_url?: string;
	comments_url?: string;
	events_url?: string;
	html_url?: string;
	number?: number;
	state?: string;
	title?: string;
	body?: string;
	user?: User;
	labels?: Label[];
	assignee?: User;
	milestone?: Milestone;
	locked?: boolean;
	comments?: number;
	pull_request?: PullRequest;
	closed_at?: any;
	created_at?: Date;
	updated_at?: Date;
	closed_by?: User;
}


export interface Reactions {
	total_count?: number;
	"+1": number;
	"-1": number;
	laugh?: number;
	confused?: number;
	heart?: number;
	hooray?: number;
	url?: string;
}

export interface Comment {
	id?: number;
	url?: string;
	html_url?: string;
	body?: string;
	user?: User;
	created_at?: Date;
	updated_at?: Date;
}



export interface Permission {
	admin: boolean;
	push: boolean;
	pull: boolean;
}

export interface Repo {
	id: number;
	owner: User;
	name: string;
	full_name: string;
	description: string;
	private: boolean;
	fork: boolean;
	url: string;
	html_url: string;
	archive_url: string;
	assignees_url: string;
	blobs_url: string;
	branches_url: string;
	clone_url: string;
	collaborators_url: string;
	comments_url: string;
	commits_url: string;
	compare_url: string;
	contents_url: string;
	contributors_url: string;
	deployments_url: string;
	downloads_url: string;
	events_url: string;
	forks_url: string;
	git_commits_url: string;
	git_refs_url: string;
	git_tags_url: string;
	git_url: string;
	hooks_url: string;
	issue_comment_url: string;
	issue_events_url: string;
	issues_url: string;
	keys_url: string;
	labels_url: string;
	languages_url: string;
	merges_url: string;
	milestones_url: string;
	mirror_url: string;
	notifications_url: string;
	pulls_url: string;
	releases_url: string;
	ssh_url: string;
	stargazers_url: string;
	statuses_url: string;
	subscribers_url: string;
	subscription_url: string;
	svn_url: string;
	tags_url: string;
	teams_url: string;
	trees_url: string;
	homepage: string;
	language?: any;
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
	permissions: Permission;
}



export function isIssue(o:any):o is Issue {
	return o.title && o.id && o.labels
}