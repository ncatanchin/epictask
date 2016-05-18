declare module GitHubObjects {

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



}

