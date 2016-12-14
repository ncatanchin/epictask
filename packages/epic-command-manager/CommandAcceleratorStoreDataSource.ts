

import { customAcceleratorsSelector } from "epic-typedux/selectors"

export default function () {
	return customAcceleratorsSelector(getStoreState())
}