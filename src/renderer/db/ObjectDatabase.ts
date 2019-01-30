import Dexie from "dexie"
//import 'dexie-observable'
import {IIssue, IIssueEvent, IssueEventIndexes, IssueIndexes} from "common/models/Issue"
import {IUser, UserIndexes} from "common/models/User"
import {CollaboratorIndexes, ICollaborator, IRepo, RepoIndexes} from "common/models/Repo"
import getLogger from "common/log/Logger"
import {IOrg, OrgIndexes} from "common/models/Org"
import {ILabel, LabelIndexes} from "common/models/Label"
import {IMilestone, MilestoneIndexes} from "common/models/Milestone"
import {CommentIndexes, IComment} from "common/models/Comment"
import {INotification, NotificationIndexes} from "common/models/Notification"

const log = getLogger(__filename)

class ObjectDatabase extends Dexie {

  get notifications(): Dexie.Table<INotification<any>, string> {
    return this.table("notifications")
  }

	get issues(): Dexie.Table<IIssue, number> {
		return this.table("issues")
	}

  get issueEvents(): Dexie.Table<IIssueEvent, number> {
    return this.table("issueEvents")
  }

	get users(): Dexie.Table<IUser, number> {
		return this.table("users")
	}

	get labels(): Dexie.Table<ILabel, number> {
		return this.table("labels")
	}

	get repos(): Dexie.Table<IRepo, number> {
		return this.table("repos")
	}

	get orgs(): Dexie.Table<IOrg, number> {
		return this.table("orgs")
	}

  get milestones(): Dexie.Table<IMilestone, number> {
    return this.table("milestones")
  }

  get comments(): Dexie.Table<IComment, number> {
    return this.table("comments")
  }

  get collaborators(): Dexie.Table<ICollaborator, [string,string]> {
    return this.table("collaborators")
  }

	constructor() {
		super("epictask")

		// this.version(1).stores({
		// 	issues: IssueIndexes.v1,
		// 	labels: LabelIndexes.v1,
		// 	users: UserIndexes.v1,
		// 	repos: RepoIndexes.v1,
		// 	orgs: OrgIndexes.v1,
    //   comments: CommentIndexes.v1,
    //   milestones: MilestoneIndexes.v1
		// })

    this.version(4).stores({
      issues: IssueIndexes.v1,
      issueEvents: IssueEventIndexes.v1,
      labels: LabelIndexes.v1,
      users: UserIndexes.v1,
      repos: RepoIndexes.v1,
      orgs: OrgIndexes.v1,
      comments: CommentIndexes.v1,
      milestones: MilestoneIndexes.v1,
      collaborators: CollaboratorIndexes.v1,
      notifications: NotificationIndexes.v1
    })

		log.info("Start database")
	}

}


export interface IObjectDatabase extends ObjectDatabase {
}


const db = new ObjectDatabase()

export type ObjectDatabaseType = keyof ObjectDatabase

export default db
