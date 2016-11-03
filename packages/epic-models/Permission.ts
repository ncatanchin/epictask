

export class Permission implements IPermission {
	
	
	admin: boolean;
	push: boolean;
	pull: boolean;

	constructor(props = {}) {
		Object.assign(this,props)
	}
}

