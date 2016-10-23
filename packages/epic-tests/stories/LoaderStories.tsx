// Setup story environment
import {getDecorator} from "./StoryHelper"

import {Loader} from "ui/components/common/Loader"

const {storiesOf, action, linkTo} = require('@kadira/storybook')


// logger
const log = getLogger(__filename)

storiesOf('Loader Animation',module)
	.addDecorator(getDecorator)
	
	// JobMonitor - no logs
	.add('Responsive loader', () => {
		
		
		return <Loader animate/>
	})
	