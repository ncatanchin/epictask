export class Reactions {
	total_count: number;
	"+1": number;
	"-1": number;
	laugh: number;
	confused: number;
	heart: number;
	hooray: number;
	url: string;

	constructor(props = {}) {
		Object.assign(this,props)
	}
}
