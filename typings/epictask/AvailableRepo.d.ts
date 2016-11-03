
declare enum LoadStatus {
	NotLoaded = 1,
	Loading = 2,
	Loaded = 3
}


declare interface IAvailableRepo {
	
	
	id:number
	
	/**
	 * Repo id ref
	 */
	
	repoId:number
	
	/**
	 * Enabled or not enabled
	 */
	
	enabled:boolean
	
	/**
	 * Is this repo deleted
	 */
	
	deleted:boolean
	
	/**
	 * Repo reference
	 */
	
	repo:IRepo
	
	/**
	 * All current labels
	 */
	
	labels:ILabel[]
	
	/**
	 * All current milestones
	 */
	
	milestones:IMilestone[]
	
	/**
	 * All available assignees/collaborators
	 */
	
	collaborators:IUser[]
	
	/**
	 * Current load status of the repo
	 */
	
	repoLoadStatus:LoadStatus
	
	/**
	 * Current load status of issues for this repo
	 */
	
	issuesLoadStatus:LoadStatus
}

