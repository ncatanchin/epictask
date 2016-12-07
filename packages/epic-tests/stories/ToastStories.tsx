// Setup story environment
import {getDecorator} from "./StoryHelper"

import {Button} from "epic-ui-components"
import {getStoreState} from "epic-typedux"
import {clearNotifications,notifyError, notify, notifySuccess} from "epic-global"
import {ToastMessages} from "epic-ui-components"

const {storiesOf, action, linkTo} = require('@kadira/storybook')


// logger
const log = getLogger(__filename)

storiesOf('Toast',module)
	.addDecorator(getDecorator)
	
	// Single Job - no updates
	.add('With Info Message', () => {
		clearNotifications()
		notify('Some info can be nice ;)')
		
		return <ToastMessages />
	})
	
	// Single Job - no updates
	.add('With Success Message', () => {
		clearNotifications()
		notifySuccess('Good = good / ALWAYS')
		
		return <ToastMessages />
	})
	
	// Single Job - no updates
	.add('With Error Message', () => {
		clearNotifications()
		notifyError('Arg an error occurred!')
		
		return <ToastMessages />
	})
	