
declare type TIssueState = "open" | "closed"

declare interface IIssue {
	
	id: number;
	
	
	repoId:number
	
	/**
	 * Globally unique url to view the issue
	 */
	
	url: string;
	
	
	/**
	 * Associated repo
	 *
	 * @transient
	 */
	
	repo:IRepo
	
	
	/**
	 * Milestones
	 *
	 * @transient
	 */
	milestones:IMilestone[]
	
	/**
	 * Collaborators
	 *
	 * @transient
	 */
	collaborators:IUser[]
	
	/**
	 * State open/closed
	 */
	
	state: TIssueState;
	
	
	repository_url: string;
	
	labels_url: string;
	
	comments_url: string;
	
	events_url: string;
	
	html_url: string;
	
	
	number: number;
	
	
	title: string;
	
	
	body: string;
	
	
	user: IUser;
	
	
	labels: ILabel[];
	
	
	assignee: IUser;
	
	
	milestone: IMilestone;
	
	
	locked: boolean;
	
	
	comments: number;
	
	
	pull_request: IPullRequest;
	
	
	closed_at: any;
	
	
	created_at: Date;
	
	
	updated_at: Date;
	
	
	closed_by: IUser;
}