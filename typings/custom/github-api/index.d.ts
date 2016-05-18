
declare module "github-api" {
	export class GitHub {

		constructor(auth?:any)


		getGist(id?:any):any


		getUser(user?:any):any


		getOrganization(organization?:any):any


		getRepo(user?:any, repo?:any):any


		getIssues(user?:any, repo?:any):any


		search(query?:any):any


		getRateLimit():any


		getMarkdown():any


		_getFullName(user?:any, repo?:any):any

	}
	export default GitHub

}

