


export class PullRequest implements IPullRequest {
	url: string;
	html_url: string;
	diff_url: string;
	patch_url: string;

	constructor(props = {}) {
		Object.assign(this,props)
	}
}
