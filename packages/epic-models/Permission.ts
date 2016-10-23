

export class Permission {
	admin: boolean;
	push: boolean;
	pull: boolean;

	constructor(props = {}) {
		Object.assign(this,props)
	}
}

