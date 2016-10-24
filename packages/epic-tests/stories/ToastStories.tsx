// Setup story environment
import {getDecorator} from "./StoryHelper"

import {Button} from "epic-ui-components"
import {getStoreState} from "epic-typedux"
import {clearMessages,addErrorMessage, addMessage, addSuccessMessage} from "epic-global"
import {ToastMessages} from "epic-ui-components"

const {storiesOf, action, linkTo} = require('@kadira/storybook')


// logger
const log = getLogger(__filename)

storiesOf('Toast',module)
	.addDecorator(getDecorator)
	
	// Single Job - no updates
	.add('With Info Message', () => {
		clearMessages()
		addMessage('Some info can be nice ;)')
		
		return <ToastMessages />
	})
	
	// Single Job - no updates
	.add('With Success Message', () => {
		clearMessages()
		addSuccessMessage('Good = good / ALWAYS')
		
		return <ToastMessages />
	})
	
	// Single Job - no updates
	.add('With Error Message', () => {
		clearMessages()
		addErrorMessage('Arg an error occurred!')
		
		return <ToastMessages />
	})
	