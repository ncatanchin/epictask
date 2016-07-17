// create a "selector creator" that uses lodash.isEqual instead of ===
import {createSelectorCreator,defaultMemoize} from 'reselect'

export const createDeepEqualSelector = createSelectorCreator(
	defaultMemoize,
	_.isEqual
)

