// Setup story environment
import {getDecorator} from "./StoryHelper"

import {Button} from 'ui/components/common"
import {getStoreState} from "shared/store"
import * as uuid from 'node-uuid'
import {Loader} from "ui/components/common/Loader"

const {storiesOf, action, linkTo} = require('@kadira/storybook')


// logger
const log = getLogger(__filename)

storiesOf('Loader Animation',module)
	.addDecorator(getDecorator)
	
	// JobMonitor - no logs
	.add('Responsive loader', () => {
		
		
		return <Loader />
	})
	